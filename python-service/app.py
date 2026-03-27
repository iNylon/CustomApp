import json
import os
import random
import time
from datetime import datetime, timezone

import psycopg2
import redis
from flask import Flask, jsonify, request
from opentelemetry import context as otel_context
from opentelemetry import metrics, propagate, trace
from opentelemetry.trace import SpanKind
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
    trace_id = f"{span_context.trace_id:032x}" if span_context and span_context.is_valid else None
    span_id = f"{span_context.span_id:016x}" if span_context and span_context.is_valid else None

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


@app.before_request
def before_request():
    request._start_time = time.perf_counter()
    extracted = propagate.extract(dict(request.headers))
    request._otel_token = otel_context.attach(extracted)


@app.after_request
def after_request(response):
    duration = (time.perf_counter() - request._start_time) * 1000
    attrs = {"route": request.path, "status": response.status_code}
    request_counter.add(1, attrs)
    latency_histogram.record(duration, attrs)
    log("INFO", "python request complete", path=request.path, status=response.status_code, duration_ms=round(duration, 2))
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
        cache = get_redis()
        cache_key = f"recommendations:{user_id}"
        cached = cache.get(cache_key)
        if cached and not DB_BOTTLENECK_MODE:
            payload = json.loads(cached)
            log("INFO", "served recommendations from cache", user_id=user_id)
            return jsonify(payload)

        with get_pg_connection() as conn, conn.cursor() as cur:
            waste_queries = 0

            if DB_BOTTLENECK_MODE:
                cur.execute("SELECT id FROM users WHERE id = 1 FOR UPDATE")
                cur.execute("SELECT pg_sleep(0.15)")
                waste_queries += 2

                for _ in range(DB_BOTTLENECK_LOOPS):
                    cur.execute("SELECT COUNT(*) FROM recommendations WHERE user_id = %s", (user_id,))
                    cur.fetchone()
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
                    waste_queries += 1
                    tier = tier_row[0] if tier_row else row[1]
                else:
                    tier = row[1]

                items.append({"email": row[0], "tier": tier, "sku": row[2], "score": float(row[3])})

        payload = {
            "service": SERVICE_NAME,
            "user_id": user_id,
            "items": items,
            "cache": False,
            "waste_queries": waste_queries,
        }
        cache.setex(cache_key, 5 if DB_BOTTLENECK_MODE else 20, json.dumps(payload))

        if random.randint(1, 100) <= 12:
            error_counter.add(1, {"route": request.path})
            log("ERROR", "synthetic python recommendation error", user_id=user_id)
            return jsonify({"error": "synthetic recommendation failure", "service": SERVICE_NAME}), 503

        log("INFO", "served recommendations from postgres", user_id=user_id, count=len(payload["items"]))
        return jsonify(payload)


if __name__ == "__main__":
    log("INFO", "starting python recommendation service", endpoint=OTLP_ENDPOINT)
    app.run(host="0.0.0.0", port=int(os.getenv("APP_PORT", "8000")))
