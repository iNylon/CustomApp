<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/AppLogger.php';
require_once __DIR__ . '/../src/OtlpHttpEmitter.php';

$serviceName = getenv('APP_SERVICE_NAME') ?: 'php-storefront';
$logFile = getenv('APP_LOG_FILE') ?: '/tmp/php-storefront.log';
$emitter = new OtlpHttpEmitter(
    getenv('OTEL_EXPORTER_OTLP_HTTP_ENDPOINT') ?: 'http://otel-collector:4318',
    [
        'service.name' => $serviceName,
        'service.namespace' => 'openobserve-poc',
        'deployment.environment' => getenv('APP_ENV') ?: 'poc',
    ]
);
$logger = new AppLogger($serviceName, $logFile);

$requestStart = microtime(true);
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$rootSpan = $emitter->startSpan('php.request', [
    'http.method' => $method,
    'http.route' => $path,
]);

try {
    route($path, $method, $logger, $emitter, $requestStart);
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');

    $logger->error('Unhandled PHP exception', [
        'exception' => $e->getMessage(),
        'path' => $path,
    ]);

    $emitter->exportTrace($emitter->finishSpan($rootSpan, [
        'http.status_code' => 500,
        'error' => true,
    ], true, $e->getMessage()));
    $emitter->exportMetrics([
        $emitter->counter('php_requests_total', 1, ['route' => $path, 'status' => 500]),
        $emitter->counter('php_errors_total', 1, ['route' => $path]),
        $emitter->histogram('php_request_duration_ms', elapsedMs($requestStart), ['route' => $path, 'status' => 500]),
    ]);

    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_SLASHES);
}

function route(string $path, string $method, AppLogger $logger, OtlpHttpEmitter $emitter, float $requestStart): void
{
    if ($path === '/') {
        header('Content-Type: text/html; charset=utf-8');
        echo renderIndex();
        finalize($path, 200, $requestStart, $logger, $emitter, 'Rendered storefront');
        return;
    }

    if ($path === '/rum-config.js') {
        header('Content-Type: application/javascript; charset=utf-8');
        echo 'window.__OPENOBSERVE_RUM__ = ' . json_encode([
            'enabled' => getenv('APP_ENABLE_RUM') === 'true',
            'clientToken' => getenv('APP_RUM_CLIENT_TOKEN') ?: '',
            'applicationId' => getenv('APP_RUM_APPLICATION_ID') ?: '',
            'site' => getenv('APP_RUM_SITE') ?: '',
            'organizationIdentifier' => getenv('APP_RUM_ORGANIZATION_IDENTIFIER') ?: '',
            'service' => getenv('APP_RUM_SERVICE') ?: '',
            'env' => getenv('APP_RUM_ENV') ?: 'poc',
            'version' => getenv('APP_RUM_VERSION') ?: '0.0.1',
            'apiVersion' => getenv('APP_RUM_API_VERSION') ?: 'v1',
            'insecureHTTP' => getenv('APP_RUM_INSECURE_HTTP') === 'true',
        ], JSON_UNESCAPED_SLASHES) . ';';
        finalize($path, 200, $requestStart, $logger, $emitter, 'Served rum config');
        return;
    }

    if ($path === '/healthz') {
        header('Content-Type: application/json');
        echo json_encode(['ok' => true], JSON_UNESCAPED_SLASHES);
        finalize($path, 200, $requestStart, $logger, $emitter, 'Health check');
        return;
    }

    if ($path === '/api/error') {
        throw new RuntimeException('Intentional PHP error path triggered');
    }

    if ($path === '/api/summary' || $path === '/api/checkout') {
        $payload = buildSummary($path, $logger);

        if ($path === '/api/checkout' && random_int(1, 100) <= 18) {
            $logger->error('Checkout chaos triggered', ['route' => $path]);
            throw new RuntimeException('Synthetic checkout failure for observability demo');
        }

        header('Content-Type: application/json');
        echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        finalize($path, 200, $requestStart, $logger, $emitter, 'Served business payload', [
            'cart_size' => count($payload['catalog']['items'] ?? []),
        ]);
        return;
    }

    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Not found'], JSON_UNESCAPED_SLASHES);
    finalize($path, 404, $requestStart, $logger, $emitter, 'Route not found');
}

function buildSummary(string $route, AppLogger $logger): array
{
    $mysql = queryMysql();
    $postgres = queryPostgres();
    $redis = queryRedis();

    $catalog = httpJson((getenv('NODE_SERVICE_URL') ?: 'http://node-catalog:3000') . '/inventory');
    $recommendations = httpJson((getenv('PYTHON_SERVICE_URL') ?: 'http://python-recommendation:8000') . '/recommendations?user_id=' . random_int(1, 3));
    $checkout = httpJson((getenv('JAVA_SERVICE_URL') ?: 'http://java-checkout:8081') . '/quote');

    $logger->info('Aggregated multi-service payload', [
        'route' => $route,
        'mysql_rows' => $mysql['product_count'],
        'postgres_rows' => $postgres['recommendation_count'],
        'redis' => $redis['redis_ping'],
    ]);

    return [
        'service' => 'php-storefront',
        'route' => $route,
        'timestamp' => gmdate('c'),
        'mysql' => $mysql,
        'postgres' => $postgres,
        'redis' => $redis,
        'catalog' => $catalog,
        'recommendations' => $recommendations,
        'checkout' => $checkout,
    ];
}

function queryMysql(): array
{
    $pdo = new PDO(
        getenv('MYSQL_DSN') ?: 'mysql:host=mysql;port=3306;dbname=catalog',
        getenv('MYSQL_USER') ?: 'app',
        getenv('MYSQL_PASSWORD') ?: 'app',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $row = $pdo->query('SELECT COUNT(*) AS product_count, SUM(inventory) AS inventory_total FROM products')->fetch(PDO::FETCH_ASSOC);

    return [
        'product_count' => (int) ($row['product_count'] ?? 0),
        'inventory_total' => (int) ($row['inventory_total'] ?? 0),
    ];
}

function queryPostgres(): array
{
    $pdo = new PDO(
        getenv('POSTGRES_DSN') ?: 'pgsql:host=postgres;port=5432;dbname=recommendations',
        getenv('POSTGRES_USER') ?: 'app',
        getenv('POSTGRES_PASSWORD') ?: 'app',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $row = $pdo->query('SELECT COUNT(*) AS recommendation_count FROM recommendations')->fetch(PDO::FETCH_ASSOC);

    return [
        'recommendation_count' => (int) ($row['recommendation_count'] ?? 0),
    ];
}

function queryRedis(): array
{
    $redis = new Redis();
    $redis->connect(getenv('REDIS_HOST') ?: 'redis', (int) (getenv('REDIS_PORT') ?: 6379), 1.5);
    $redis->set('php:last_seen', gmdate('c'));

    return [
        'redis_ping' => $redis->ping(),
        'php_last_seen' => (string) $redis->get('php:last_seen'),
    ];
}

function httpJson(string $url): array
{
    global $http_response_header;

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 3,
            'ignore_errors' => true,
        ],
    ]);

    $response = @file_get_contents($url, false, $context);
    if ($response === false) {
        throw new RuntimeException('Downstream call failed: ' . $url);
    }

    $statusLine = $http_response_header[0] ?? '';
    if (preg_match('/\s(\d{3})\s/', $statusLine, $matches) === 1 && (int) $matches[1] >= 500) {
        throw new RuntimeException('Downstream returned server error: ' . $statusLine . ' for ' . $url);
    }

    $decoded = json_decode($response, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Invalid downstream JSON from ' . $url);
    }

    return $decoded;
}

function renderIndex(): string
{
    return <<<'HTML'
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>OpenObserve OTEL PoC</title>
  <script src="/rum-config.js"></script>
  <script src="/assets/app.js" defer></script>
  <style>
    :root {
      --bg: #f5efe6;
      --panel: rgba(255,255,255,0.84);
      --ink: #1b1e23;
      --accent: #bf5b04;
      --accent-2: #136f63;
      --line: rgba(27,30,35,0.12);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(191,91,4,0.18), transparent 34%),
        radial-gradient(circle at bottom right, rgba(19,111,99,0.18), transparent 26%),
        linear-gradient(135deg, #efe5d7, #f8f5ef 60%, #e8f2ef);
      min-height: 100vh;
    }
    main {
      max-width: 1080px;
      margin: 0 auto;
      padding: 40px 20px 60px;
    }
    .hero {
      background: var(--panel);
      backdrop-filter: blur(10px);
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.08);
    }
    h1 {
      margin: 0 0 12px;
      font-size: clamp(2.2rem, 5vw, 4rem);
      line-height: 0.95;
      letter-spacing: -0.04em;
    }
    p {
      margin: 0 0 16px;
      max-width: 60ch;
      line-height: 1.5;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 24px 0 16px;
    }
    button {
      border: none;
      cursor: pointer;
      padding: 12px 18px;
      border-radius: 999px;
      font-size: 1rem;
      font-weight: 700;
    }
    .primary { background: var(--accent); color: white; }
    .secondary { background: var(--accent-2); color: white; }
    .danger { background: #962c2c; color: white; }
    pre {
      margin-top: 24px;
      padding: 20px;
      border-radius: 18px;
      background: #11161b;
      color: #f7fafc;
      overflow: auto;
      min-height: 260px;
      font-size: 0.92rem;
    }
    .meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      margin-top: 18px;
    }
    .card {
      padding: 14px;
      border-radius: 16px;
      background: rgba(255,255,255,0.8);
      border: 1px solid var(--line);
    }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <h1>OpenObserve<br>Telemetry Playground</h1>
      <p>Deze PHP-frontapp roept Python, NodeJS, Java, MySQL, PostgreSQL en Redis aan en genereert bewust veel traces, metrics, logs en fouten via OpenTelemetry en de OTEL Collector.</p>
      <div class="actions">
        <button class="primary" onclick="callApi('/api/summary')">Summary laden</button>
        <button class="secondary" onclick="callApi('/api/checkout')">Checkout simuleren</button>
        <button class="danger" onclick="callApi('/api/error')">Fout triggeren</button>
      </div>
      <div class="meta">
        <div class="card"><strong>Tracing</strong><br>PHP -> Node/Python/Java</div>
        <div class="card"><strong>Metrics</strong><br>Request, errors, latency</div>
        <div class="card"><strong>Logs</strong><br>JSON via collector filelog</div>
        <div class="card"><strong>RUM-ready</strong><br>Config endpoint staat klaar</div>
      </div>
      <pre id="output">Klik op een actie om verkeer te genereren.</pre>
    </section>
  </main>
  <script>
    async function callApi(path) {
      const output = document.getElementById('output');
      output.textContent = 'Laden...';
      try {
        const response = await fetch(path);
        const data = await response.json();
        output.textContent = JSON.stringify(data, null, 2);
      } catch (error) {
        output.textContent = error.message;
      }
    }
  </script>
</body>
</html>
HTML;
}

function finalize(string $path, int $status, float $requestStart, AppLogger $logger, OtlpHttpEmitter $emitter, string $message, array $extraAttributes = []): void
{
    $latency = elapsedMs($requestStart);
    $logger->info($message, [
        'path' => $path,
        'status' => $status,
        'duration_ms' => $latency,
    ]);

    $emitter->exportTrace($emitter->finishSpan($emitter->startSpan('php.finalize', ['http.route' => $path]), array_merge([
        'http.status_code' => $status,
        'http.route' => $path,
        'http.method' => $_SERVER['REQUEST_METHOD'] ?? 'GET',
        'duration_ms' => $latency,
    ], $extraAttributes), $status >= 500));
    $emitter->exportMetrics([
        $emitter->counter('php_requests_total', 1, ['route' => $path, 'status' => $status]),
        $emitter->histogram('php_request_duration_ms', $latency, ['route' => $path, 'status' => $status]),
    ]);
}

function elapsedMs(float $requestStart): float
{
    return round((microtime(true) - $requestStart) * 1000, 2);
}
