package nl.dylan.openobserve;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.common.AttributeKey;
import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.metrics.DoubleHistogram;
import io.opentelemetry.api.metrics.LongCounter;
import io.opentelemetry.api.metrics.Meter;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.StatusCode;
import io.opentelemetry.api.trace.Tracer;
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
import java.util.Map;
import java.util.Random;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import redis.clients.jedis.Jedis;

public final class App {
  private static final String SERVICE_NAME = System.getenv().getOrDefault("APP_SERVICE_NAME", "java-checkout");
  private static final String LOG_FILE = System.getenv().getOrDefault("APP_LOG_FILE", "/tmp/java-checkout.log");
  private static final String OTLP_ENDPOINT = System.getenv().getOrDefault("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4317");
  private static final String REDIS_HOST = System.getenv().getOrDefault("REDIS_HOST", "redis");
  private static final int REDIS_PORT = Integer.parseInt(System.getenv().getOrDefault("REDIS_PORT", "6379"));
  private static final int PORT = Integer.parseInt(System.getenv().getOrDefault("APP_PORT", "8081"));
  private static final Random RANDOM = new Random();

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
      requestCounter.add(1, Attributes.of(AttributeKey.stringKey("route"), "/healthz"));
      writeJson(exchange, 200, "{\"ok\":true,\"service\":\"" + SERVICE_NAME + "\"}");
    });

    server.createContext("/quote", exchange -> {
      long start = System.nanoTime();
      Span span = tracer.spanBuilder("java.quote").startSpan();
      try (Jedis jedis = new Jedis(REDIS_HOST, REDIS_PORT)) {
        jedis.set("java:last_quote", Instant.now().toString());
        double quote = 29.99 + RANDOM.nextInt(60);
        boolean failure = RANDOM.nextInt(100) < 14;

        requestCounter.add(1, Attributes.of(AttributeKey.stringKey("route"), "/quote"));
        if (failure) {
          errorCounter.add(1, Attributes.of(AttributeKey.stringKey("route"), "/quote"));
          throw new RuntimeException("synthetic java checkout failure");
        }

        String body = "{\"service\":\"" + SERVICE_NAME + "\",\"quote\":" + quote + ",\"redis_marker\":\"" + jedis.get("java:last_quote") + "\"}";
        writeJson(exchange, 200, body);
        log("INFO", "java quote served", Map.of("quote", quote));
      } catch (Exception error) {
        span.recordException(error);
        span.setStatus(StatusCode.ERROR, error.getMessage());
        errorCounter.add(1, Attributes.of(AttributeKey.stringKey("route"), "/quote"));
        log("ERROR", "java quote failed", Map.of("error", error.getMessage()));
        writeJson(exchange, 503, "{\"error\":\"" + error.getMessage() + "\",\"service\":\"" + SERVICE_NAME + "\"}");
      } finally {
        latencyHistogram.record((System.nanoTime() - start) / 1_000_000.0, Attributes.of(AttributeKey.stringKey("route"), "/quote"));
        span.end();
      }
    });

    log("INFO", "starting java checkout service", Map.of("port", PORT, "otlp", OTLP_ENDPOINT));
    server.start();
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
    String entry = String.format(
        "{\"timestamp\":\"%s\",\"severity\":\"%s\",\"service.name\":\"%s\",\"message\":\"%s\",\"context\":%s}%n",
        Instant.now(),
        severity,
        SERVICE_NAME,
        message.replace("\"", "'"),
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
}
