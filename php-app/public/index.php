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
    route($path, $method, $logger, $emitter, $requestStart, $rootSpan);
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');

    $logger->error('Unhandled PHP exception', [
        'exception' => $e->getMessage(),
        'path' => $path,
    ]);

    $emitter->exportTrace($emitter->finishSpan($rootSpan, [
        'http.status_code' => 500,
        'http.route' => $path,
        'error' => true,
    ], true, $e->getMessage()));

    $emitter->exportMetrics([
        $emitter->counter('php_requests_total', 1, ['route' => $path, 'status' => 500]),
        $emitter->counter('php_errors_total', 1, ['route' => $path]),
        $emitter->histogram('php_request_duration_ms', elapsedMs($requestStart), ['route' => $path, 'status' => 500]),
    ]);

    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_SLASHES);
}

function route(string $path, string $method, AppLogger $logger, OtlpHttpEmitter $emitter, float $requestStart, array $rootSpan): void
{
    if ($path === '/') {
        header('Content-Type: text/html; charset=utf-8');
        echo renderIndex();
        finalize($path, 200, $requestStart, $logger, $emitter, 'Rendered storefront');
        finishRootSpan($emitter, $rootSpan, $path, 200);
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
        finishRootSpan($emitter, $rootSpan, $path, 200);
        return;
    }

    if ($path === '/healthz') {
        header('Content-Type: application/json');
        echo json_encode(['ok' => true], JSON_UNESCAPED_SLASHES);
        finalize($path, 200, $requestStart, $logger, $emitter, 'Health check');
        finishRootSpan($emitter, $rootSpan, $path, 200);
        return;
    }

    if ($path === '/api/error') {
        throw new RuntimeException('Intentional PHP error path triggered');
    }

    if ($path === '/api/summary' || $path === '/api/checkout') {
        $payload = buildSummary($path, $logger, $emitter);

        if ($path === '/api/checkout' && random_int(1, 100) <= 18) {
            $logger->error('Checkout chaos triggered', ['route' => $path]);
            throw new RuntimeException('Synthetic checkout failure for observability demo');
        }

        header('Content-Type: application/json');
        echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

        $status = $payload['degraded'] ? 206 : 200;
        finalize($path, $status, $requestStart, $logger, $emitter, 'Served business payload', [
            'cart_size' => count($payload['catalog']['items'] ?? []),
            'degraded' => $payload['degraded'],
        ]);
        finishRootSpan($emitter, $rootSpan, $path, $status, [
            'degraded' => $payload['degraded'],
            'component_errors' => $payload['component_errors'],
        ], $payload['degraded']);
        return;
    }

    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Not found'], JSON_UNESCAPED_SLASHES);
    finalize($path, 404, $requestStart, $logger, $emitter, 'Route not found');
    finishRootSpan($emitter, $rootSpan, $path, 404);
}

function buildSummary(string $route, AppLogger $logger, OtlpHttpEmitter $emitter): array
{
    $mysqlProbe = probeStep('mysql', fn () => queryMysql(), $logger, $emitter);
    $mysqlShadowProbe = probeStep('mysql_shadow', fn () => queryMysql(), $logger, $emitter);
    $postgresProbe = probeStep('postgres', fn () => queryPostgres(), $logger, $emitter);
    $postgresShadowProbe = probeStep('postgres_shadow', fn () => queryPostgres(), $logger, $emitter);
    $redisProbe = probeStep('redis', fn () => queryRedis(), $logger, $emitter);

    $catalogProbe = probeStep('node_catalog', fn () => httpJson((getenv('NODE_SERVICE_URL') ?: 'http://node-catalog:3000') . '/inventory', true), $logger, $emitter);
    $recommendationsProbe = probeStep('python_recommendations', fn () => httpJson((getenv('PYTHON_SERVICE_URL') ?: 'http://python-recommendation:8000') . '/recommendations?user_id=1', true), $logger, $emitter);
    $checkoutProbe = probeStep('java_checkout', fn () => httpJson((getenv('JAVA_SERVICE_URL') ?: 'http://java-checkout:8081') . '/quote', true), $logger, $emitter);

    $componentErrors = count(array_filter([
        $mysqlProbe['ok'] ? null : 'mysql',
        $mysqlShadowProbe['ok'] ? null : 'mysql_shadow',
        $postgresProbe['ok'] ? null : 'postgres',
        $postgresShadowProbe['ok'] ? null : 'postgres_shadow',
        $redisProbe['ok'] ? null : 'redis',
        $catalogProbe['ok'] ? null : 'node_catalog',
        $recommendationsProbe['ok'] ? null : 'python_recommendations',
        $checkoutProbe['ok'] ? null : 'java_checkout',
    ]));

    $logger->info('Aggregated multi-service payload', [
        'route' => $route,
        'mysql_rows' => (int) (($mysqlProbe['data']['product_count'] ?? 0)),
        'postgres_rows' => (int) (($postgresProbe['data']['recommendation_count'] ?? 0)),
        'redis_ping' => (string) (($redisProbe['data']['redis_ping'] ?? 'FAILED')),
        'component_errors' => $componentErrors,
    ]);

    return [
        'service' => 'php-storefront',
        'route' => $route,
        'timestamp' => gmdate('c'),
        'degraded' => $componentErrors > 0,
        'component_errors' => $componentErrors,
        'mysql' => $mysqlProbe['data'],
        'mysql_shadow' => $mysqlShadowProbe['data'],
        'postgres' => $postgresProbe['data'],
        'postgres_shadow' => $postgresShadowProbe['data'],
        'redis' => $redisProbe['data'],
        'catalog' => $catalogProbe['data'],
        'recommendations' => $recommendationsProbe['data'],
        'checkout' => $checkoutProbe['data'],
    ];
}

function probeStep(string $name, callable $operation, AppLogger $logger, OtlpHttpEmitter $emitter): array
{
    $start = microtime(true);
    $span = $emitter->startSpan('php.component.' . $name, [
        'component.name' => $name,
        'component.type' => 'dependency',
    ]);

    try {
        $data = $operation();

        $emitter->exportTrace($emitter->finishSpan($span, [
            'component.name' => $name,
            'component.ok' => true,
            'duration_ms' => elapsedMs($start),
        ]));

        return ['ok' => true, 'data' => $data];
    } catch (Throwable $error) {
        $message = $error->getMessage();

        $emitter->exportTrace($emitter->finishSpan($span, [
            'component.name' => $name,
            'component.ok' => false,
            'duration_ms' => elapsedMs($start),
            'error' => true,
        ], true, $message));

        $emitter->exportMetrics([
            $emitter->counter('php_component_errors_total', 1, ['component' => $name]),
            $emitter->histogram('php_component_error_duration_ms', elapsedMs($start), ['component' => $name]),
        ]);

        $logger->error('Component probe failed', [
            'component' => $name,
            'error' => $message,
        ]);

        return [
            'ok' => false,
            'data' => [
                'error' => $message,
                'component' => $name,
            ],
        ];
    }
}

function queryMysql(): array
{
    $options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION];
    if (defined('PDO::MYSQL_ATTR_USE_BUFFERED_QUERY')) {
        $options[PDO::MYSQL_ATTR_USE_BUFFERED_QUERY] = true;
    }

    $pdo = new PDO(
        getenv('MYSQL_DSN') ?: 'mysql:host=mysql;port=3306;dbname=catalog',
        getenv('MYSQL_USER') ?: 'app',
        getenv('MYSQL_PASSWORD') ?: 'app',
        $options
    );

    $wasteQueries = 0;

    if (isDbBottleneckModeEnabled()) {
        try {
            $pdo->beginTransaction();

            $stmt = $pdo->query('SELECT id FROM products WHERE id = 1 FOR UPDATE');
            $stmt->fetchAll(PDO::FETCH_ASSOC);
            $stmt->closeCursor();
            $wasteQueries++;

            $stmt = $pdo->query('SELECT SLEEP(0.12) AS waited');
            $stmt->fetchColumn();
            $stmt->closeCursor();
            $wasteQueries++;

            $categories = ['apparel', 'accessories', 'stationery'];
            for ($i = 0; $i < getDbBottleneckLoops(); $i++) {
                $category = $categories[$i % count($categories)];
                $stmt = $pdo->prepare('SELECT COUNT(*) FROM products WHERE category = :category');
                $stmt->execute(['category' => $category]);
                $stmt->fetchColumn();
                $stmt->closeCursor();
                $wasteQueries++;
            }

            if (random_int(1, 100) <= 14) {
                throw new RuntimeException('synthetic mysql lock wait timeout');
            }

            $stmt = $pdo->query('SELECT COUNT(*) AS product_count, SUM(inventory) AS inventory_total FROM products');
            $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
            $stmt->closeCursor();

            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    } else {
        $stmt = $pdo->query('SELECT COUNT(*) AS product_count, SUM(inventory) AS inventory_total FROM products');
        $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
        $stmt->closeCursor();
    }

    return [
        'product_count' => (int) ($row['product_count'] ?? 0),
        'inventory_total' => (int) ($row['inventory_total'] ?? 0),
        'waste_queries' => $wasteQueries,
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

    $wasteQueries = 0;

    if (isDbBottleneckModeEnabled()) {
        try {
            $pdo->beginTransaction();

            $stmt = $pdo->query('SELECT id FROM users WHERE id = 1 FOR UPDATE');
            $stmt->fetchAll(PDO::FETCH_ASSOC);
            $stmt->closeCursor();
            $wasteQueries++;

            $stmt = $pdo->query('SELECT pg_sleep(0.15)');
            $stmt->fetchAll(PDO::FETCH_ASSOC);
            $stmt->closeCursor();
            $wasteQueries++;

            for ($i = 0; $i < getDbBottleneckLoops(); $i++) {
                $userId = ($i % 3) + 1;
                $stmt = $pdo->prepare('SELECT COUNT(*) FROM recommendations WHERE user_id = :user_id');
                $stmt->execute(['user_id' => $userId]);
                $stmt->fetchColumn();
                $stmt->closeCursor();
                $wasteQueries++;
            }

            if (random_int(1, 100) <= 14) {
                throw new RuntimeException('synthetic postgres deadlock detected');
            }

            $stmt = $pdo->query('SELECT COUNT(*) AS recommendation_count FROM recommendations');
            $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
            $stmt->closeCursor();

            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    } else {
        $stmt = $pdo->query('SELECT COUNT(*) AS recommendation_count FROM recommendations');
        $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
        $stmt->closeCursor();
    }

    return [
        'recommendation_count' => (int) ($row['recommendation_count'] ?? 0),
        'waste_queries' => $wasteQueries,
    ];
}

function queryRedis(): array
{
    $redis = new Redis();
    $redis->connect(getenv('REDIS_HOST') ?: 'redis', (int) (getenv('REDIS_PORT') ?: 6379), 1.5);

    $loops = max(1, min((int) (getenv('APP_REDIS_BOTTLENECK_LOOPS') ?: 20), 200));
    $wasteOps = 0;
    $retryConflicts = 0;

    $redis->set('php:last_seen', gmdate('c'));
    $hotKey = 'redis:hotspot:counter';

    if (isDbBottleneckModeEnabled()) {
        for ($i = 0; $i < $loops; $i++) {
            $redis->watch($hotKey);
            $current = (int) ($redis->get($hotKey) ?: 0);
            usleep(40000);

            $redis->multi();
            $redis->set($hotKey, (string) ($current + 1));
            $redis->expire($hotKey, 120);
            $tx = $redis->exec();

            if ($tx === false) {
                $retryConflicts++;
                continue;
            }

            $redis->get($hotKey);
            $redis->pttl($hotKey);
            $wasteOps += 4;
        }
    }

    if (isDbBottleneckModeEnabled() && $retryConflicts >= max(2, (int) floor($loops * 0.25))) {
        throw new RuntimeException('synthetic redis transaction conflicts exceeded threshold');
    }

    return [
        'redis_ping' => $redis->ping(),
        'php_last_seen' => (string) $redis->get('php:last_seen'),
        'redis_waste_ops' => $wasteOps,
        'redis_tx_conflicts' => $retryConflicts,
    ];
}

function isDbBottleneckModeEnabled(): bool
{
    $value = getenv('APP_DB_BOTTLENECK_MODE');
    if ($value === false) {
        return true;
    }

    return strtolower((string) $value) !== 'false';
}

function getDbBottleneckLoops(): int
{
    $value = (int) (getenv('APP_DB_BOTTLENECK_LOOPS') ?: 8);

    return max(1, min($value, 50));
}

function httpJson(string $url, bool $allowServerError = false): array
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
    $statusCode = 200;
    if (preg_match('/\s(\d{3})\s/', $statusLine, $matches) === 1) {
        $statusCode = (int) $matches[1];
    }

    $decoded = json_decode($response, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Invalid downstream JSON from ' . $url);
    }

    if ($statusCode >= 500) {
        if ($allowServerError) {
            return [
                'downstream_error' => true,
                'status_code' => $statusCode,
                'status_line' => $statusLine,
                'payload' => $decoded,
            ];
        }

        throw new RuntimeException('Downstream returned server error: ' . $statusLine . ' for ' . $url);
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
  <title>Northstar Market | Observability Demo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700&family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet">
  <script src="/rum-config.js"></script>
  <script src="/assets/app.js" defer></script>
  <style>
    :root {
      --bg-a: #f4ead5;
      --bg-b: #dce9de;
      --ink: #1e2932;
      --accent: #b85d15;
      --accent-soft: #f7d9bc;
      --ok: #1e6b5c;
      --card: rgba(255, 255, 255, 0.8);
      --line: rgba(30, 41, 50, 0.14);
      --shadow: 0 20px 50px rgba(30, 41, 50, 0.14);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Manrope, sans-serif;
      color: var(--ink);
      min-height: 100vh;
      background:
        radial-gradient(1000px 450px at -12% -10%, rgba(184, 93, 21, 0.24), transparent 72%),
        radial-gradient(900px 450px at 108% 12%, rgba(30, 107, 92, 0.22), transparent 68%),
        linear-gradient(145deg, var(--bg-a), var(--bg-b));
    }
    .shell {
      max-width: 1200px;
      margin: 0 auto;
      padding: 30px 18px 42px;
      display: grid;
      gap: 18px;
    }
    .hero {
      border: 1px solid var(--line);
      border-radius: 26px;
      padding: 24px;
      background: linear-gradient(130deg, rgba(255,255,255,0.92), rgba(255,255,255,0.72));
      box-shadow: var(--shadow);
    }
    .hero h1 {
      font-family: Fraunces, serif;
      font-size: clamp(1.9rem, 4.8vw, 3.4rem);
      line-height: 0.95;
      margin: 0;
      letter-spacing: -0.03em;
    }
    .hero p {
      max-width: 72ch;
      margin: 10px 0 0;
      line-height: 1.55;
    }
    .layout {
      display: grid;
      grid-template-columns: 1.4fr 0.9fr;
      gap: 16px;
    }
    .panel {
      border: 1px solid var(--line);
      border-radius: 22px;
      background: var(--card);
      box-shadow: 0 12px 26px rgba(30, 41, 50, 0.08);
    }
    .products { padding: 18px; }
    .toolbar {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10px;
      margin-bottom: 12px;
    }
    input, select {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 10px 12px;
      font: inherit;
      background: #fff;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 10px;
    }
    .sku {
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 11px;
      background: rgba(255,255,255,0.9);
      animation: rise .38s ease both;
    }
    .sku h3 {
      margin: 0;
      font-size: 1rem;
    }
    .sku p {
      margin: 7px 0;
      font-size: 0.88rem;
      color: rgba(30, 41, 50, 0.82);
      min-height: 34px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .badge {
      font-size: 0.76rem;
      letter-spacing: 0.02em;
      padding: 3px 8px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: #5f3110;
    }
    button {
      border: none;
      cursor: pointer;
      border-radius: 11px;
      padding: 9px 11px;
      font: inherit;
      font-weight: 700;
      transition: transform .15s ease, filter .2s ease;
    }
    button:hover { transform: translateY(-1px); filter: brightness(0.98); }
    .btn-main { background: var(--accent); color: #fff; }
    .btn-sub { background: #1f685a; color: #fff; }
    .btn-clear { background: #ebebeb; color: #242424; }
    .side {
      padding: 16px;
      display: grid;
      gap: 12px;
      align-content: start;
    }
    .kpi {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .kpi > div {
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #fff;
      padding: 10px;
      text-align: center;
    }
    .kpi strong {
      display: block;
      font-size: 1.1rem;
      margin-bottom: 3px;
    }
    .checkout {
      display: grid;
      gap: 8px;
    }
    .log {
      background: #111820;
      color: #e8edf2;
      border-radius: 14px;
      min-height: 210px;
      max-height: 280px;
      overflow: auto;
      padding: 11px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.82rem;
      line-height: 1.4;
    }
    .pill {
      display: inline-block;
      margin-left: 6px;
      border-radius: 999px;
      font-size: 0.72rem;
      padding: 2px 8px;
      background: rgba(30, 107, 92, 0.2);
      color: var(--ok);
    }
    @keyframes rise {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 980px) {
      .layout { grid-template-columns: 1fr; }
      .kpi { grid-template-columns: repeat(3, minmax(0,1fr)); }
    }
  </style>
</head>
<body>
  <div class="shell">
    <section class="hero">
      <h1>Northstar Market</h1>
      <p>
        Demo webshop die bewust veel traffic en bottlenecks maakt voor OpenObserve.
        Elke actie triggert backend-calls naar MySQL, PostgreSQL, Redis, Node, Python en Java,
        zodat RUM, traces, metrics en logs direct bruikbaar zijn.
      </p>
    </section>

    <section class="layout">
      <article class="panel products">
        <div class="toolbar">
          <input id="search" placeholder="Zoek product, categorie of sku">
          <select id="category">
            <option value="all">Alle categorieen</option>
            <option value="apparel">Apparel</option>
            <option value="accessories">Accessories</option>
            <option value="stationery">Stationery</option>
          </select>
        </div>
        <div id="grid" class="grid"></div>
      </article>

      <aside class="panel side">
        <h2 style="margin: 0; font-family: Fraunces, serif;">Winkelwagen <span class="pill">RUM heavy</span></h2>
        <div class="kpi">
          <div><strong id="kpi-items">0</strong><span>Items</span></div>
          <div><strong id="kpi-subtotal">0.00</strong><span>Subtotal</span></div>
          <div><strong id="kpi-lat">-</strong><span>API ms</span></div>
        </div>

        <div id="cart"></div>

        <div class="checkout">
          <button class="btn-main" id="btn-summary">Ververs aanbevelingen</button>
          <button class="btn-sub" id="btn-checkout">Bestelling afronden</button>
          <button class="btn-clear" id="btn-chaos">Trigger foutpad</button>
        </div>

        <div class="log" id="log">Start webshop-simulatie: voeg producten toe en klik op acties.</div>
      </aside>
    </section>
  </div>

  <script>
    const products = [
      { sku: 'SKU-100', name: 'PHP Hoodie', category: 'apparel', price: 59.99, desc: 'Warm en zacht, met mini-logo op de mouw.' },
      { sku: 'SKU-101', name: 'Node Mug', category: 'accessories', price: 12.49, desc: 'Keramische mok voor deploy-dagen.' },
      { sku: 'SKU-102', name: 'Python Notebook', category: 'stationery', price: 9.95, desc: 'Lijnpapier voor design en SQL-notes.' },
      { sku: 'SKU-103', name: 'Java Sticker Pack', category: 'accessories', price: 4.99, desc: 'Retro stickers voor je laptop.' },
      { sku: 'SKU-104', name: 'OTEL Cap', category: 'apparel', price: 19.99, desc: 'Lichte cap met trace icon.' },
      { sku: 'SKU-105', name: 'Redis Socks', category: 'apparel', price: 14.95, desc: 'Snelle voeten voor snelle cache hits.' },
    ];

    const cart = new Map();
    const grid = document.getElementById('grid');
    const cartBox = document.getElementById('cart');
    const logBox = document.getElementById('log');
    const kpiItems = document.getElementById('kpi-items');
    const kpiSubtotal = document.getElementById('kpi-subtotal');
    const kpiLat = document.getElementById('kpi-lat');
    const searchInput = document.getElementById('search');
    const categoryInput = document.getElementById('category');

    function euro(value) {
      return Number(value).toFixed(2);
    }

    function totalItems() {
      let amount = 0;
      for (const qty of cart.values()) {
        amount += qty;
      }
      return amount;
    }

    function subtotal() {
      let total = 0;
      for (const item of products) {
        total += (cart.get(item.sku) || 0) * item.price;
      }
      return total;
    }

    function appendLog(title, payload) {
      const stamp = new Date().toISOString();
      const lines = [`[${stamp}] ${title}`];
      if (payload !== undefined) {
        lines.push(JSON.stringify(payload, null, 2));
      }
      logBox.textContent = `${lines.join('\n')}\n\n${logBox.textContent}`.slice(0, 7000);
    }

    function setKpis(latencyMs) {
      kpiItems.textContent = String(totalItems());
      kpiSubtotal.textContent = euro(subtotal());
      if (typeof latencyMs === 'number') {
        kpiLat.textContent = String(Math.round(latencyMs));
      }
    }

    function renderCart() {
      const entries = [...cart.entries()].filter(([, qty]) => qty > 0);
      if (entries.length === 0) {
        cartBox.innerHTML = '<p style="margin:0;color:rgba(30,41,50,.7)">Nog geen items in je winkelwagen.</p>';
        setKpis();
        return;
      }

      cartBox.innerHTML = entries.map(([sku, qty]) => {
        const item = products.find((p) => p.sku === sku);
        const lineTotal = item ? item.price * qty : 0;
        return `
          <div style="border:1px solid var(--line);border-radius:11px;padding:8px;margin-bottom:8px;background:#fff;">
            <div style="display:flex;justify-content:space-between;gap:8px;">
              <strong>${item ? item.name : sku}</strong>
              <span>x${qty}</span>
            </div>
            <div style="font-size:.85rem;color:rgba(30,41,50,.74)">EUR ${euro(lineTotal)}</div>
          </div>
        `;
      }).join('');

      setKpis();
    }

    function renderGrid() {
      const term = searchInput.value.trim().toLowerCase();
      const category = categoryInput.value;
      const filtered = products.filter((item) => {
        const inCategory = category === 'all' || item.category === category;
        const inTerm = term === '' || `${item.name} ${item.category} ${item.sku}`.toLowerCase().includes(term);
        return inCategory && inTerm;
      });

      grid.innerHTML = filtered.map((item) => `
        <article class="sku">
          <div class="row">
            <h3>${item.name}</h3>
            <span class="badge">${item.category}</span>
          </div>
          <p>${item.desc}</p>
          <div class="row">
            <strong>EUR ${euro(item.price)}</strong>
            <button class="btn-main" data-sku="${item.sku}">Toevoegen</button>
          </div>
        </article>
      `).join('');

      grid.querySelectorAll('button[data-sku]').forEach((button) => {
        button.addEventListener('click', () => {
          const sku = button.getAttribute('data-sku');
          cart.set(sku, (cart.get(sku) || 0) + 1);
          renderCart();
          appendLog('cart:add', { sku, qty: cart.get(sku) });
        });
      });
    }

    async function callApi(path, title) {
      const start = performance.now();
      try {
        const response = await fetch(path, { method: 'GET' });
        const data = await response.json();
        const latency = performance.now() - start;
        setKpis(latency);
        appendLog(`${title} (${response.status})`, data);
      } catch (error) {
        const latency = performance.now() - start;
        setKpis(latency);
        appendLog(`${title} (network-fail)`, { error: error.message });
      }
    }

    let filterTimer;
    function triggerBrowseTelemetry() {
      clearTimeout(filterTimer);
      filterTimer = setTimeout(() => {
        callApi('/api/summary', 'browse:summary-refresh');
      }, 240);
    }

    document.getElementById('btn-summary').addEventListener('click', () => {
      callApi('/api/summary', 'manual:summary');
    });

    document.getElementById('btn-checkout').addEventListener('click', () => {
      callApi('/api/checkout', 'manual:checkout');
    });

    document.getElementById('btn-chaos').addEventListener('click', () => {
      callApi('/api/error', 'manual:error-path');
    });

    searchInput.addEventListener('input', () => {
      renderGrid();
      triggerBrowseTelemetry();
    });

    categoryInput.addEventListener('change', () => {
      renderGrid();
      triggerBrowseTelemetry();
    });

    renderGrid();
    renderCart();
    callApi('/api/summary', 'startup:summary');
  </script>
</body>
</html>
HTML;
}

function finishRootSpan(OtlpHttpEmitter $emitter, array $rootSpan, string $path, int $status, array $attributes = [], bool $error = false): void
{
    $baseAttributes = [
        'http.status_code' => $status,
        'http.route' => $path,
    ];

    $emitter->exportTrace($emitter->finishSpan($rootSpan, array_merge($baseAttributes, $attributes), $error));
}

function finalize(string $path, int $status, float $requestStart, AppLogger $logger, OtlpHttpEmitter $emitter, string $message, array $extraAttributes = []): void
{
    $latency = elapsedMs($requestStart);
    $logger->info($message, [
        'path' => $path,
        'status' => $status,
        'duration_ms' => $latency,
    ]);

    $span = $emitter->startSpan('php.finalize', ['http.route' => $path]);
    $emitter->exportTrace($emitter->finishSpan($span, array_merge([
        'http.status_code' => $status,
        'http.route' => $path,
        'http.method' => $_SERVER['REQUEST_METHOD'] ?? 'GET',
        'duration_ms' => $latency,
    ], $extraAttributes), $status >= 500));

    $metrics = [
        $emitter->counter('php_requests_total', 1, ['route' => $path, 'status' => $status]),
        $emitter->histogram('php_request_duration_ms', $latency, ['route' => $path, 'status' => $status]),
    ];

    if ($status >= 500) {
        $metrics[] = $emitter->counter('php_errors_total', 1, ['route' => $path]);
    }

    $emitter->exportMetrics($metrics);
}

function elapsedMs(float $requestStart): float
{
    return round((microtime(true) - $requestStart) * 1000, 2);
}
