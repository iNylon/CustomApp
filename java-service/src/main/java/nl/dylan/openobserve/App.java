package nl.dylan.openobserve;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.Headers;
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.common.AttributeKey;
import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.metrics.DoubleHistogram;
import io.opentelemetry.api.metrics.LongCounter;
import io.opentelemetry.api.metrics.Meter;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanContext;
import io.opentelemetry.api.trace.SpanKind;
import io.opentelemetry.api.trace.StatusCode;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.api.trace.propagation.W3CTraceContextPropagator;
import io.opentelemetry.context.Context;
import io.opentelemetry.context.Scope;
import io.opentelemetry.context.propagation.TextMapGetter;
import io.opentelemetry.exporter.otlp.metrics.OtlpGrpcMetricExporter;
import io.opentelemetry.exporter.otlp.trace.OtlpGrpcSpanExporter;
import io.opentelemetry.sdk.OpenTelemetrySdk;
import io.opentelemetry.sdk.metrics.SdkMeterProvider;
import io.opentelemetry.sdk.metrics.export.PeriodicMetricReader;
import io.opentelemetry.sdk.resources.Resource;
import io.opentelemetry.sdk.trace.SdkTracerProvider;
import io.opentelemetry.sdk.trace.export.BatchSpanProcessor;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.Executors;
import redis.clients.jedis.Jedis;

public final class App {
  private static final String SERVICE_NAME = System.getenv().getOrDefault("APP_SERVICE_NAME", "java-checkout");
  private static final String LOG_FILE = System.getenv().getOrDefault("APP_LOG_FILE", "/tmp/java-checkout.log");
  private static final String OTLP_ENDPOINT = System.getenv().getOrDefault("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4317");
  private static final String REDIS_HOST = System.getenv().getOrDefault("REDIS_HOST", "redis");
  private static final int REDIS_PORT = Integer.parseInt(System.getenv().getOrDefault("REDIS_PORT", "6379"));
  private static final int PORT = Integer.parseInt(System.getenv().getOrDefault("APP_PORT", "8081"));
  private static final int FAILURE_RATE_PERCENT = Integer.parseInt(System.getenv().getOrDefault("APP_SYNTHETIC_FAILURE_RATE_PERCENT", "8"));
  private static final Random RANDOM = new Random();
  private static final TextMapGetter<Headers> HEADER_GETTER = new TextMapGetter<>() {
    @Override
    public Iterable<String> keys(Headers carrier) {
      return carrier.keySet();
    }

    @Override
    public String get(Headers carrier, String key) {
      if (carrier == null) {
        return null;
      }
      List<String> values = carrier.get(key);
      if (values == null || values.isEmpty()) {
        return null;
      }
      return values.get(0);
    }
  };

  private App() {
  }

  public static void main(String[] args) throws IOException {
    Resource resource = Resource.getDefault().merge(Resource.create(Attributes.builder()
        .put("service.name", SERVICE_NAME)
        .put("service.namespace", "openobserve-poc")
        .put("deployment.environment", "poc")
        .build()));

    SdkTracerProvider tracerProvider = SdkTracerProvider.builder()
        .setResource(resource)
        .addSpanProcessor(BatchSpanProcessor.builder(OtlpGrpcSpanExporter.builder().setEndpoint(OTLP_ENDPOINT).build()).build())
        .build();

    SdkMeterProvider meterProvider = SdkMeterProvider.builder()
        .setResource(resource)
        .registerMetricReader(PeriodicMetricReader.builder(
            OtlpGrpcMetricExporter.builder().setEndpoint(OTLP_ENDPOINT).build())
            .setInterval(java.time.Duration.ofSeconds(5))
            .build())
        .build();

    OpenTelemetrySdk.builder()
        .setTracerProvider(tracerProvider)
        .setMeterProvider(meterProvider)
        .buildAndRegisterGlobal();

    Tracer tracer = GlobalOpenTelemetry.getTracer(SERVICE_NAME);
    Meter meter = GlobalOpenTelemetry.getMeter(SERVICE_NAME);
    LongCounter requestCounter = meter.counterBuilder("java_requests_total").build();
    LongCounter errorCounter = meter.counterBuilder("java_errors_total").build();
    DoubleHistogram latencyHistogram = meter.histogramBuilder("java_request_duration_ms").setUnit("ms").build();

    HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
    server.setExecutor(Executors.newFixedThreadPool(8));

    server.createContext("/healthz", exchange -> {
      String requestId = getRequestId(exchange);
      exchange.getResponseHeaders().set("x-request-id", requestId);
      requestCounter.add(1, Attributes.of(AttributeKey.stringKey("route"), "/healthz"));
      writeJson(exchange, 200, "{\"ok\":true,\"service\":\"" + SERVICE_NAME + "\",\"request_id\":\"" + requestId + "\"}");
    });

    server.createContext("/quote", exchange -> {
      String requestId = getRequestId(exchange);
      exchange.getResponseHeaders().set("x-request-id", requestId);
      long start = System.nanoTime();
      Context parentContext = W3CTraceContextPropagator.getInstance().extract(Context.root(), exchange.getRequestHeaders(), HEADER_GETTER);
      Span span = tracer.spanBuilder("java.quote").setParent(parentContext).setSpanKind(SpanKind.SERVER).startSpan();
      try (Scope scope = span.makeCurrent(); Jedis jedis = new Jedis(REDIS_HOST, REDIS_PORT)) {
        span.setAttribute("request.id", requestId);
        jedis.set("java:last_quote", Instant.now().toString());
        double quote = 29.99 + RANDOM.nextInt(60);
        boolean failure = RANDOM.nextInt(100) < Math.max(0, Math.min(FAILURE_RATE_PERCENT, 100));
        boolean forceFailure = "fail=1".equals(exchange.getRequestURI().getQuery());

        requestCounter.add(1, Attributes.of(AttributeKey.stringKey("route"), "/quote"));
        if (forceFailure || failure) {
          errorCounter.add(1, Attributes.of(AttributeKey.stringKey("route"), "/quote"));
          throw new RuntimeException("java checkout quote computation failed");
        }

        String body = "{\"service\":\"" + SERVICE_NAME + "\",\"request_id\":\"" + requestId + "\",\"quote\":" + quote + ",\"redis_marker\":\"" + jedis.get("java:last_quote") + "\"}";
        writeJson(exchange, 200, body);
        log("INFO", "java quote served", Map.of("quote", quote, "request_id", requestId));
      } catch (Exception error) {
        span.recordException(error);
        applyErrorAttributes(span, error, "java-checkout", "application");
        span.setStatus(StatusCode.ERROR, error.getMessage());
        errorCounter.add(1, Attributes.of(AttributeKey.stringKey("route"), "/quote"));
        log("ERROR", "java quote failed", errorContextForLog(error, requestId));
        writeJson(exchange, 503, "{\"error\":\"" + error.getMessage() + "\",\"service\":\"" + SERVICE_NAME + "\",\"request_id\":\"" + requestId + "\"}");
      } finally {
        latencyHistogram.record((System.nanoTime() - start) / 1_000_000.0, Attributes.of(AttributeKey.stringKey("route"), "/quote"));
        span.end();
      }
    });

    log("INFO", "starting java checkout service", Map.of("port", PORT, "otlp", OTLP_ENDPOINT));
    server.start();
  }

  private static String getRequestId(HttpExchange exchange) {
    String headerValue = exchange.getRequestHeaders().getFirst("x-request-id");
    if (headerValue != null && !headerValue.isBlank()) {
      return headerValue;
    }
    return "req-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
  }

  private static void writeJson(HttpExchange exchange, int statusCode, String body) throws IOException {
    byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
    exchange.getResponseHeaders().set("Content-Type", "application/json");
    exchange.sendResponseHeaders(statusCode, bytes.length);
    try (OutputStream outputStream = exchange.getResponseBody()) {
      outputStream.write(bytes);
    }
  }

  private static void log(String severity, String message, Map<String, Object> context) throws IOException {
    SpanContext spanContext = Span.current().getSpanContext();
    String traceId = spanContext.isValid() ? spanContext.getTraceId() : "";
    String spanId = spanContext.isValid() ? spanContext.getSpanId() : "";
    String entry = String.format(
      "{\"timestamp\":\"%s\",\"severity\":\"%s\",\"service.name\":\"%s\",\"message\":\"%s\",\"trace_id\":\"%s\",\"span_id\":\"%s\",\"context\":%s}%n",
        Instant.now(),
        severity,
        SERVICE_NAME,
        message.replace("\"", "'"),
        traceId,
        spanId,
        mapToJson(context));
    java.nio.file.Files.writeString(
        java.nio.file.Path.of(LOG_FILE),
        entry,
        java.nio.file.StandardOpenOption.CREATE,
        java.nio.file.StandardOpenOption.APPEND);
    System.out.print(entry);
  }

  private static String mapToJson(Map<String, Object> context) {
    StringBuilder builder = new StringBuilder("{");
    boolean first = true;
    for (Map.Entry<String, Object> entry : context.entrySet()) {
      if (!first) {
        builder.append(",");
      }
      first = false;
      builder.append("\"").append(entry.getKey()).append("\":");
      Object value = entry.getValue();
      if (value instanceof Number || value instanceof Boolean) {
        builder.append(value);
      } else {
        builder.append("\"").append(String.valueOf(value).replace("\"", "'")).append("\"");
      }
    }
    builder.append("}");
    return builder.toString();
  }

  private static void applyErrorAttributes(Span span, Throwable error, String symptomComponent, String symptomLayer) {
    StackTraceElement frame = firstApplicationFrame(error);
    span.setAttribute("exception.type", error.getClass().getSimpleName());
    span.setAttribute("exception.message", String.valueOf(error.getMessage()));
    span.setAttribute("exception.stacktrace", stackTraceAsString(error));
    span.setAttribute("code.file.path", frame.getFileName() == null ? "App.java" : frame.getFileName());
    span.setAttribute("code.function.name", frame.getClassName() + "." + frame.getMethodName());
    span.setAttribute("code.line.number", frame.getLineNumber());
  }

  private static Map<String, Object> errorContextForLog(Throwable error, String requestId) {
    StackTraceElement frame = firstApplicationFrame(error);
    Map<String, Object> context = new LinkedHashMap<>();
    context.put("error", error.getMessage());
    context.put("request_id", requestId);
    context.put("error_type", error.getClass().getSimpleName());
    context.put("code_file_path", frame.getFileName() == null ? "App.java" : frame.getFileName());
    context.put("code_function_name", frame.getClassName() + "." + frame.getMethodName());
    context.put("code_line_number", frame.getLineNumber());
    return context;
  }

  private static StackTraceElement firstApplicationFrame(Throwable error) {
    for (StackTraceElement frame : error.getStackTrace()) {
      if (frame.getClassName().startsWith("nl.dylan.openobserve")) {
        return frame;
      }
    }
    return error.getStackTrace().length > 0 ? error.getStackTrace()[0] : new StackTraceElement("nl.dylan.openobserve.App", "{unknown}", "App.java", 0);
  }

  private static String stackTraceAsString(Throwable error) {
    StringBuilder builder = new StringBuilder();
    builder.append(error.toString()).append("\n");
    for (StackTraceElement frame : error.getStackTrace()) {
      builder.append("at ").append(frame).append("\n");
    }
    return builder.toString();
  }
}
