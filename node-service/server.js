const fs = require('fs');
const express = require('express');
const mysql = require('mysql2/promise');
const { createClient } = require('redis');
const { trace, metrics } = require('@opentelemetry/api');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-grpc');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');

const serviceName = process.env.APP_SERVICE_NAME || 'node-catalog';
const logFile = process.env.APP_LOG_FILE || '/tmp/node-catalog.log';
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4317';
const dbBottleneckMode = (process.env.APP_DB_BOTTLENECK_MODE || 'true').toLowerCase() !== 'false';
const dbBottleneckLoops = Math.max(1, Number(process.env.APP_DB_BOTTLENECK_LOOPS || '12'));

const sdk = new NodeSDK({
  resource: new Resource({
    'service.name': serviceName,
    'service.namespace': 'openobserve-poc',
    'deployment.environment': 'poc',
  }),
  traceExporter: new OTLPTraceExporter({ url: otlpEndpoint, credentials: undefined }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: otlpEndpoint, credentials: undefined }),
    exportIntervalMillis: 5000,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

const tracer = trace.getTracer(serviceName);
const meter = metrics.getMeter(serviceName);
const requestCounter = meter.createCounter('node_requests_total');
const errorCounter = meter.createCounter('node_errors_total');
const latencyHistogram = meter.createHistogram('node_request_duration_ms', { unit: 'ms' });

const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'mysql',
  port: Number(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'app',
  password: process.env.MYSQL_PASSWORD || 'app',
  database: process.env.MYSQL_DATABASE || 'catalog',
  connectionLimit: 5,
});

const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT || '6379'),
  },
});

redis.connect().catch((error) => {
  log('ERROR', 'redis connection failed', { error: error.message });
});

const app = express();

function log(severity, message, context = {}) {
  const activeSpan = trace.getActiveSpan();
  const spanContext = activeSpan ? activeSpan.spanContext() : undefined;
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    severity,
    'service.name': serviceName,
    message,
    trace_id: spanContext ? spanContext.traceId : undefined,
    span_id: spanContext ? spanContext.spanId : undefined,
    context,
  });
  fs.appendFileSync(logFile, entry + '\n');
  process.stdout.write(entry + '\n');
}

app.use((req, res, next) => {
  const start = performance.now();
  res.on('finish', () => {
    const duration = performance.now() - start;
    const attrs = { route: req.path, status: res.statusCode };
    requestCounter.add(1, attrs);
    latencyHistogram.record(duration, attrs);
    log('INFO', 'node request complete', { path: req.path, status: res.statusCode, duration_ms: Number(duration.toFixed(2)) });
  });
  next();
});

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, service: serviceName });
});

app.get('/inventory', async (_req, res) => {
  return tracer.startActiveSpan('node.inventory', async (span) => {
    try {
      const [rows] = await mysqlPool.query('SELECT sku, name, category, price, inventory FROM products ORDER BY id LIMIT 25');
      const wasteQueryCount = dbBottleneckMode ? await induceMysqlBottleneck(rows) : 0;
      await redis.set('node:last_inventory_fetch', new Date().toISOString());

      if (Math.random() < 0.1) {
        errorCounter.add(1, { route: '/inventory' });
        throw new Error('synthetic node inventory failure');
      }

      res.json({
        service: serviceName,
        items: rows,
        waste_queries: wasteQueryCount,
        redis_marker: await redis.get('node:last_inventory_fetch'),
      });
      span.setAttribute('catalog.item_count', rows.length);
      span.setAttribute('catalog.waste_queries', wasteQueryCount);
      span.end();
    } catch (error) {
      errorCounter.add(1, { route: '/inventory' });
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      log('ERROR', 'node inventory failed', { error: error.message });
      res.status(503).json({ error: error.message, service: serviceName });
      span.end();
    }
  });
});

async function induceMysqlBottleneck(rows) {
  const connection = await mysqlPool.getConnection();
  const products = rows.length > 0 ? rows : [{ sku: 'SKU-100' }];
  let totalQueries = 0;

  try {
    await connection.beginTransaction();
    await connection.query('SELECT id FROM products WHERE id = 1 FOR UPDATE');
    await connection.query('SELECT SLEEP(0.12)');
    totalQueries += 2;

    const loopCount = Math.max(dbBottleneckLoops, products.length);
    for (let i = 0; i < loopCount; i += 1) {
      const sku = products[i % products.length].sku;
      await connection.query('SELECT inventory, price FROM products WHERE sku = ?', [sku]);
      totalQueries += 1;
    }

    await connection.commit();
    return totalQueries;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

app.listen(Number(process.env.APP_PORT || '3000'), '0.0.0.0', () => {
  log('INFO', 'starting node catalog service', { endpoint: otlpEndpoint });
});
