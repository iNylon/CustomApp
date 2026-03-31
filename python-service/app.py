import json
import os
import random
import time
import traceback
import uuid
from datetime import datetime, timezone

import psycopg2
import redis
from flask import Flask, jsonify, request
from opentelemetry import context as otel_context
from opentelemetry import metrics, propagate, trace
from opentelemetry.trace import SpanKind, Status, StatusCode
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

SERVICE_NAME = os.getenv("APP_SERVICE_NAME", "python-recommendation")
LOG_FILE = os.getenv("APP_LOG_FILE", "/tmp/python-recommendation.log")
OTLP_ENDPOINT = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4317")
DB_BOTTLENECK_MODE = os.getenv("APP_DB_BOTTLENECK_MODE", "true").lower() != "false"
DB_BOTTLENECK_LOOPS = max(1, int(os.getenv("APP_DB_BOTTLENECK_LOOPS", "10")))

resource = Resource.create(
    {
        "service.name": SERVICE_NAME,
        "service.namespace": "openobserve-poc",
        "deployment.environment": "poc",
    }
)

trace_provider = TracerProvider(resource=resource)
trace_provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=OTLP_ENDPOINT, insecure=True)))
trace.set_tracer_provider(trace_provider)
tracer = trace.get_tracer(SERVICE_NAME)

metric_reader = PeriodicExportingMetricReader(
    OTLPMetricExporter(endpoint=OTLP_ENDPOINT, insecure=True),
    export_interval_millis=5000,
)
meter_provider = MeterProvider(resource=resource, metric_readers=[metric_reader])
metrics.set_meter_provider(meter_provider)
meter = metrics.get_meter(SERVICE_NAME)
request_counter = meter.create_counter("python_requests_total")
error_counter = meter.create_counter("python_errors_total")
latency_histogram = meter.create_histogram("python_request_duration_ms", unit="ms")

app = Flask(__name__)


def log(severity: str, message: str, **context):
    span_context = trace.get_current_span().get_span_context()
    trace_id = f"{span_context.trace_id:032x}" if span_context and span_context.is_valid else ""
    span_id = f"{span_context.span_id:016x}" if span_context and span_context.is_valid else ""

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
        "severity": severity,
        "service.name": SERVICE_NAME,
        "message": message,
        "trace_id": trace_id,
        "span_id": span_id,
        "context": context,
    }
    line = json.dumps(entry)
    with open(LOG_FILE, "a", encoding="utf-8") as handle:
        handle.write(line + "\n")
    print(line, flush=True)


def get_pg_connection():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "postgres"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        dbname=os.getenv("POSTGRES_DB", "recommendations"),
        user=os.getenv("POSTGRES_USER", "app"),
        password=os.getenv("POSTGRES_PASSWORD", "app"),
    )


def get_redis():
    return redis.Redis(
        host=os.getenv("REDIS_HOST", "redis"),
        port=int(os.getenv("REDIS_PORT", "6379")),
        decode_responses=True,
    )


def attach_error_context(error: Exception, **context):
    existing = getattr(error, "observability_context", {})
    setattr(error, "observability_context", {**existing, **context})
    return error


def extract_error_context(error: Exception):
    return getattr(error, "observability_context", {})


def error_location(error: Exception):
    frames = traceback.extract_tb(error.__traceback__)
    for frame in reversed(frames):
        if frame.filename.endswith("app.py"):
            return {
                "code.file.path": frame.filename,
                "code.function.name": frame.name,
                "code.line.number": frame.lineno,
            }
    if frames:
        frame = frames[-1]
        return {
            "code.file.path": frame.filename,
            "code.function.name": frame.name,
            "code.line.number": frame.lineno,
        }
    return {
        "code.file.path": __file__,
        "code.function.name": "{unknown}",
        "code.line.number": 0,
    }


def classify_error(error: Exception):
    message = str(error).lower()
    if "deadlock" in message:
        return {
            "root_cause.layer": "application",
            "root_cause.component": SERVICE_NAME,
            "root_cause.reason": "conflicting_transaction_order",
            "root_cause.summary": "Python recommendation queries likely created conflicting transaction order",
            "root_cause.confidence": "high",
        }
    if "lock" in message:
        return {
            "root_cause.layer": "application",
            "root_cause.component": SERVICE_NAME,
            "root_cause.reason": "transaction_held_open",
            "root_cause.summary": "Python recommendation flow likely held a lock too long",
            "root_cause.confidence": "high",
        }
    return {
        "root_cause.layer": "application",
        "root_cause.component": SERVICE_NAME,
        "root_cause.reason": "application_runtime_failure",
        "root_cause.summary": "Python recommendation service raised an application error",
        "root_cause.confidence": "medium",
    }


def apply_error_attributes(span, error: Exception, symptom_component: str, symptom_layer: str):
    location = error_location(error)
    context = extract_error_context(error)
    classification = classify_error(error)
    span.set_attribute("symptom.component", symptom_component)
    span.set_attribute("symptom.layer", symptom_layer)
    for key, value in classification.items():
        span.set_attribute(key, value)
    span.set_attribute("exception.type", error.__class__.__name__)
    span.set_attribute("exception.message", str(error))
    span.set_attribute("exception.stacktrace", "".join(traceback.format_exception(type(error), error, error.__traceback__)))
    for key, value in location.items():
        span.set_attribute(key, value)
    for key, value in context.items():
        span.set_attribute(key, value)


@app.before_request
def before_request():
    request._start_time = time.perf_counter()
    extracted = propagate.extract(dict(request.headers))
    request._otel_token = otel_context.attach(extracted)
    request._request_id = request.headers.get("x-request-id") or f"req-{uuid.uuid4().hex[:16]}"


@app.after_request
def after_request(response):
    duration = (time.perf_counter() - request._start_time) * 1000
    attrs = {"route": request.path, "status": response.status_code}
    request_counter.add(1, attrs)
    latency_histogram.record(duration, attrs)
    response.headers["x-request-id"] = request._request_id
    log("INFO", "python request complete", path=request.path, status=response.status_code, duration_ms=round(duration, 2), request_id=request._request_id)
    token = getattr(request, "_otel_token", None)
    if token is not None:
        otel_context.detach(token)
    return response


@app.route("/healthz")
def healthz():
    return jsonify({"ok": True, "service": SERVICE_NAME})


@app.route("/recommendations")
def recommendations():
    user_id = int(request.args.get("user_id", "1"))
    with tracer.start_as_current_span("python.recommendations", kind=SpanKind.SERVER, attributes={"user.id": user_id, "http.route": "/recommendations", "http.method": "GET"}):
        span = trace.get_current_span()
        span.set_attribute("request.id", request._request_id)
        try:
            cache = get_redis()
            cache_key = f"recommendations:{user_id}"
            cached = cache.get(cache_key)
            if cached and not DB_BOTTLENECK_MODE:
                payload = json.loads(cached)
                payload["request_id"] = request._request_id
                log("INFO", "served recommendations from cache", user_id=user_id, request_id=request._request_id)
                return jsonify(payload)

            with get_pg_connection() as conn, conn.cursor() as cur:
                waste_queries = 0
                transaction_id = f"python-pg-{uuid.uuid4().hex[:10]}"
                operation_sequence = []
                last_query_type = "read"

                if DB_BOTTLENECK_MODE:
                    cur.execute("SELECT id FROM users WHERE id = 1 FOR UPDATE")
                    operation_sequence.append("lock_user_row")
                    last_query_type = "select_for_update"
                    cur.execute("SELECT pg_sleep(0.15)")
                    operation_sequence.append("hold_lock")
                    last_query_type = "sleep"
                    waste_queries += 2

                    for _ in range(DB_BOTTLENECK_LOOPS):
                        cur.execute("SELECT COUNT(*) FROM recommendations WHERE user_id = %s", (user_id,))
                        cur.fetchone()
                        operation_sequence.append("count_recommendations")
                        last_query_type = "select_count"
                        waste_queries += 1

                cur.execute(
                    """
                    SELECT u.email, u.tier, r.sku, r.score
                    FROM users u
                    JOIN recommendations r ON r.user_id = u.id
                    WHERE u.id = %s
                    ORDER BY r.score DESC
                    """,
                    (user_id,),
                )
                rows = cur.fetchall()

                items = []
                for row in rows:
                    if DB_BOTTLENECK_MODE:
                        cur.execute("SELECT tier FROM users WHERE id = %s", (user_id,))
                        tier_row = cur.fetchone()
                        operation_sequence.append("fetch_user_tier")
                        last_query_type = "select_tier"
                        waste_queries += 1
                        tier = tier_row[0] if tier_row else row[1]
                    else:
                        tier = row[1]

                    items.append({"email": row[0], "tier": tier, "sku": row[2], "score": float(row[3])})

            payload = {
                "service": SERVICE_NAME,
                "request_id": request._request_id,
                "user_id": user_id,
                "items": items,
                "cache": False,
                "waste_queries": waste_queries,
            }
            cache.setex(cache_key, 5 if DB_BOTTLENECK_MODE else 20, json.dumps(payload))

            if request.args.get("fail") == "1":
                raise attach_error_context(
                    RuntimeError("python recommendation ranking failed while composing response"),
                    **{
                        "db.system": "postgresql",
                        "db.query_type": last_query_type,
                        "db.transaction_id": transaction_id,
                        "db.lock_target": "users.id=1",
                        "db.operation_sequence": " > ".join(operation_sequence),
                    },
                )

            if random.randint(1, 100) <= 12:
                raise attach_error_context(
                    RuntimeError("python recommendation ranking failed while composing response"),
                    **{
                        "db.system": "postgresql",
                        "db.query_type": last_query_type,
                        "db.transaction_id": transaction_id,
                        "db.lock_target": "users.id=1",
                        "db.operation_sequence": " > ".join(operation_sequence),
                    },
                )

            log("INFO", "served recommendations from postgres", user_id=user_id, count=len(payload["items"]), request_id=request._request_id)
            return jsonify(payload)
        except Exception as error:
            error_counter.add(1, {"route": request.path})
            span.record_exception(error)
            apply_error_attributes(span, error, "postgres", "infrastructure")
            span.set_status(Status(StatusCode.ERROR, str(error)))
            log(
                "ERROR",
                "python recommendations failed",
                error=str(error),
                request_id=request._request_id,
                error_type=error.__class__.__name__,
                **extract_error_context(error),
            )
            return jsonify({"error": str(error), "service": SERVICE_NAME, "request_id": request._request_id}), 503


if __name__ == "__main__":
    log("INFO", "starting python recommendation service", endpoint=OTLP_ENDPOINT)
    app.run(host="0.0.0.0", port=int(os.getenv("APP_PORT", "8000")))
