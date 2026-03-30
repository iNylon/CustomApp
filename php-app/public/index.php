<?php

declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
  session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax',
  ]);
}

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
$requestId = $_SERVER['HTTP_X_REQUEST_ID'] ?? ('req-' . bin2hex(random_bytes(8)));
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$rootSpan = $emitter->startSpan('php.request', [
    'http.method' => $method,
    'http.route' => $path,
  'request.id' => $requestId,
], null, 2);
$logger->setTraceContext($rootSpan['traceId'], $rootSpan['spanId']);
$logger->setRequestId($requestId);

try {
    route($path, $method, $logger, $emitter, $requestStart, $rootSpan);
} catch (Throwable $e) {
  $errorContext = describeThrowable($e);

    http_response_code(500);
    header('Content-Type: application/json');

    $logger->error('Unhandled PHP exception', [
        'exception' => $e->getMessage(),
        'path' => $path,
    'exception_type' => (string) ($errorContext['error.type'] ?? ''),
    'exception_function' => (string) ($errorContext['error.function'] ?? ''),
    'exception_file' => (string) ($errorContext['error.file'] ?? ''),
    'exception_line' => (int) ($errorContext['error.line'] ?? 0),
    ]);

  $emitter->exportTrace($emitter->finishSpan($rootSpan, array_merge([
        'http.status_code' => 500,
        'http.route' => $path,
        'error' => true,
  ], $errorContext), true, $e->getMessage()));

    $emitter->exportMetrics([
        $emitter->counter('php_requests_total', 1, ['route' => $path, 'status' => 500]),
        $emitter->counter('php_errors_total', 1, ['route' => $path]),
        $emitter->histogram('php_request_duration_ms', elapsedMs($requestStart), ['route' => $path, 'status' => 500]),
    ]);

    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_SLASHES);
}

function route(string $path, string $method, AppLogger $logger, OtlpHttpEmitter $emitter, float $requestStart, array $rootSpan): void
{
    global $requestId;

    header('x-trace-id: ' . (string) ($rootSpan['traceId'] ?? ''));
    header('x-request-id: ' . $requestId);

    if ($path === '/') {
        header('Content-Type: text/html; charset=utf-8');
        echo renderIndex();
    finalize($path, 200, $requestStart, $logger, $emitter, $rootSpan, 'Rendered storefront');
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
        finalize($path, 200, $requestStart, $logger, $emitter, $rootSpan, 'Served rum config');
        finishRootSpan($emitter, $rootSpan, $path, 200);
        return;
    }

    if ($path === '/healthz') {
        header('Content-Type: application/json');
        echo json_encode(['ok' => true], JSON_UNESCAPED_SLASHES);
        finalize($path, 200, $requestStart, $logger, $emitter, $rootSpan, 'Health check');
        finishRootSpan($emitter, $rootSpan, $path, 200);
        return;
    }

    if ($path === '/api/register' && $method === 'POST') {
      $payload = jsonBody();
      $email = normalizeEmail((string) ($payload['email'] ?? ''));
      $password = (string) ($payload['password'] ?? '');

      if (!isValidEmail($email) || strlen($password) < 8) {
        sendJson(422, ['error' => 'Gebruik een geldig e-mailadres en minimaal 8 tekens wachtwoord.']);
        finalize($path, 422, $requestStart, $logger, $emitter, $rootSpan, 'Register validation failed');
        finishRootSpan($emitter, $rootSpan, $path, 422, [
          'auth.action' => 'register',
          'auth.success' => false,
          'user.email' => $email,
        ]);
        return;
      }

      $created = registerUser($email, $password);
      if (!$created['ok']) {
        sendJson(409, ['error' => 'E-mailadres bestaat al.']);
        $logger->error('Register failed: duplicate email', ['email' => $email]);
        $emitter->exportMetrics([
          $emitter->counter('php_auth_events_total', 1, ['action' => 'register', 'result' => 'duplicate']),
        ]);
        finalize($path, 409, $requestStart, $logger, $emitter, $rootSpan, 'Register duplicate email');
        finishRootSpan($emitter, $rootSpan, $path, 409, [
          'auth.action' => 'register',
          'auth.success' => false,
          'user.email' => $email,
        ]);
        return;
      }

      setAuthenticatedUser((int) $created['user_id'], $email);
      $logger->info('User registered', ['email' => $email]);
      $emitter->exportMetrics([
        $emitter->counter('php_auth_events_total', 1, ['action' => 'register', 'result' => 'success']),
      ]);
      sendJson(201, ['ok' => true, 'user' => ['id' => (int) $created['user_id'], 'email' => $email]]);
      finalize($path, 201, $requestStart, $logger, $emitter, $rootSpan, 'User registered');
      finishRootSpan($emitter, $rootSpan, $path, 201, [
        'auth.action' => 'register',
        'auth.success' => true,
        'user.email' => $email,
        'user.id' => (int) $created['user_id'],
      ]);
      return;
    }

    if ($path === '/api/login' && $method === 'POST') {
      $payload = jsonBody();
      $email = normalizeEmail((string) ($payload['email'] ?? ''));
      $password = (string) ($payload['password'] ?? '');

      if (!isValidEmail($email) || $password === '') {
        sendJson(422, ['error' => 'Vul een geldig e-mailadres en wachtwoord in.']);
        finalize($path, 422, $requestStart, $logger, $emitter, $rootSpan, 'Login validation failed');
        finishRootSpan($emitter, $rootSpan, $path, 422, [
          'auth.action' => 'login',
          'auth.success' => false,
          'user.email' => $email,
        ]);
        return;
      }

      $user = loginUser($email, $password);
      if ($user === null) {
        sendJson(401, ['error' => 'Onjuiste inloggegevens.']);
        $logger->error('Login failed', ['email' => $email]);
        $emitter->exportMetrics([
          $emitter->counter('php_auth_events_total', 1, ['action' => 'login', 'result' => 'failed']),
        ]);
        finalize($path, 401, $requestStart, $logger, $emitter, $rootSpan, 'Login failed');
        finishRootSpan($emitter, $rootSpan, $path, 401, [
          'auth.action' => 'login',
          'auth.success' => false,
          'user.email' => $email,
        ]);
        return;
      }

      setAuthenticatedUser((int) $user['id'], (string) $user['email']);
      $logger->info('User logged in', ['email' => (string) $user['email']]);
      $emitter->exportMetrics([
        $emitter->counter('php_auth_events_total', 1, ['action' => 'login', 'result' => 'success']),
      ]);
      sendJson(200, ['ok' => true, 'user' => ['id' => (int) $user['id'], 'email' => (string) $user['email']]]);
      finalize($path, 200, $requestStart, $logger, $emitter, $rootSpan, 'User logged in');
      finishRootSpan($emitter, $rootSpan, $path, 200, [
        'auth.action' => 'login',
        'auth.success' => true,
        'user.email' => (string) $user['email'],
        'user.id' => (int) $user['id'],
      ]);
      return;
    }

    if ($path === '/api/logout' && $method === 'POST') {
      $email = (string) ($_SESSION['user_email'] ?? '');
      clearAuthenticatedUser();
      $logger->info('User logged out', ['email' => $email]);
      $emitter->exportMetrics([
        $emitter->counter('php_auth_events_total', 1, ['action' => 'logout', 'result' => 'success']),
      ]);
      sendJson(200, ['ok' => true]);
      finalize($path, 200, $requestStart, $logger, $emitter, $rootSpan, 'User logged out');
      finishRootSpan($emitter, $rootSpan, $path, 200, [
        'auth.action' => 'logout',
        'auth.success' => true,
        'user.email' => $email,
      ]);
      return;
    }

    if ($path === '/api/me' && $method === 'GET') {
      $user = currentAuthenticatedUser();
      if ($user === null) {
        sendJson(200, ['authenticated' => false]);
        finalize($path, 200, $requestStart, $logger, $emitter, $rootSpan, 'Auth me anonymous');
        finishRootSpan($emitter, $rootSpan, $path, 200, ['auth.authenticated' => false]);
        return;
      }

      $logger->info('Auth me resolved', ['email' => $user['email']]);
      sendJson(200, ['authenticated' => true, 'user' => $user]);
      finalize($path, 200, $requestStart, $logger, $emitter, $rootSpan, 'Auth me resolved');
      finishRootSpan($emitter, $rootSpan, $path, 200, [
        'auth.authenticated' => true,
        'user.email' => (string) $user['email'],
        'user.id' => (int) $user['id'],
      ]);
      return;
    }

    if ($path === '/api/error') {
      triggerIntentionalErrorPath();
    }

    if ($path === '/api/summary' || $path === '/api/checkout') {
      $payload = buildSummary($path, $logger, $emitter, $rootSpan);

        header('Content-Type: application/json');
        echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

      $status = $path === '/api/checkout' ? 200 : ($payload['degraded'] ? 206 : 200);
        finalize($path, $status, $requestStart, $logger, $emitter, $rootSpan, 'Served business payload', [
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
    finalize($path, 404, $requestStart, $logger, $emitter, $rootSpan, 'Route not found');
    finishRootSpan($emitter, $rootSpan, $path, 404);
}

  function buildSummary(string $route, AppLogger $logger, OtlpHttpEmitter $emitter, array $rootSpan): array
{
    global $requestId;

    $mysqlProbe = probeStep('mysql', fn (array $_span) => queryMysql(), $logger, $emitter, $rootSpan, [
      'component.layer' => 'infrastructure',
      'infra.kind' => 'database',
      'db.system' => 'mysql',
      'db.name' => 'catalog',
      'server.address' => getenv('MYSQL_HOST') ?: 'mysql',
    ]);
    $mysqlShadowProbe = probeStep('mysql_shadow', fn (array $_span) => queryMysql(), $logger, $emitter, $rootSpan, [
      'component.layer' => 'infrastructure',
      'infra.kind' => 'database',
      'db.system' => 'mysql',
      'db.name' => 'catalog',
      'server.address' => getenv('MYSQL_HOST') ?: 'mysql',
    ]);
    $postgresProbe = probeStep('postgres', fn (array $_span) => queryPostgres(), $logger, $emitter, $rootSpan, [
      'component.layer' => 'infrastructure',
      'infra.kind' => 'database',
      'db.system' => 'postgresql',
      'db.name' => 'recommendations',
      'server.address' => getenv('POSTGRES_HOST') ?: 'postgres',
    ]);
    $postgresShadowProbe = probeStep('postgres_shadow', fn (array $_span) => queryPostgres(), $logger, $emitter, $rootSpan, [
      'component.layer' => 'infrastructure',
      'infra.kind' => 'database',
      'db.system' => 'postgresql',
      'db.name' => 'recommendations',
      'server.address' => getenv('POSTGRES_HOST') ?: 'postgres',
    ]);
    $redisProbe = probeStep('redis', fn (array $_span) => queryRedis(), $logger, $emitter, $rootSpan, [
      'component.layer' => 'infrastructure',
      'infra.kind' => 'cache',
      'db.system' => 'redis',
      'server.address' => getenv('REDIS_HOST') ?: 'redis',
    ]);

    $catalogProbe = probeStep('node_catalog', fn (array $span) => httpJson((getenv('NODE_SERVICE_URL') ?: 'http://node-catalog:3000') . '/inventory', true, $emitter, $span), $logger, $emitter, $rootSpan, [
      'component.layer' => 'application',
      'peer.service' => 'node-catalog',
      'http.route' => '/inventory',
    ]);
    $recommendationsProbe = probeStep('python_recommendations', fn (array $span) => httpJson((getenv('PYTHON_SERVICE_URL') ?: 'http://python-recommendation:8000') . '/recommendations?user_id=1', true, $emitter, $span), $logger, $emitter, $rootSpan, [
      'component.layer' => 'application',
      'peer.service' => 'python-recommendation',
      'http.route' => '/recommendations',
    ]);
    $checkoutProbe = probeStep('java_checkout', fn (array $span) => httpJson((getenv('JAVA_SERVICE_URL') ?: 'http://java-checkout:8081') . '/quote', true, $emitter, $span), $logger, $emitter, $rootSpan, [
      'component.layer' => 'application',
      'peer.service' => 'java-checkout',
      'http.route' => '/quote',
    ]);

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
      'request_id' => $requestId,
        'mysql_rows' => (int) (($mysqlProbe['data']['product_count'] ?? 0)),
        'postgres_rows' => (int) (($postgresProbe['data']['recommendation_count'] ?? 0)),
        'redis_ping' => (string) (($redisProbe['data']['redis_ping'] ?? 'FAILED')),
        'component_errors' => $componentErrors,
    ]);

      $order = null;
      if ($route === '/api/checkout') {
        $order = [
          'order_id' => strtoupper(bin2hex(random_bytes(6))),
          'status' => $componentErrors > 0 ? 'confirmed_with_warnings' : 'confirmed',
          'estimated_shipping_days' => random_int(1, 4),
        ];
      }

    return [
        'service' => 'php-storefront',
        'route' => $route,
        'timestamp' => gmdate('c'),
        'degraded' => $componentErrors > 0,
      'checkout_success' => $route === '/api/checkout',
        'component_errors' => $componentErrors,
        'mysql' => $mysqlProbe['data'],
        'mysql_shadow' => $mysqlShadowProbe['data'],
        'postgres' => $postgresProbe['data'],
        'postgres_shadow' => $postgresShadowProbe['data'],
        'redis' => $redisProbe['data'],
        'catalog' => $catalogProbe['data'],
        'recommendations' => $recommendationsProbe['data'],
        'checkout' => $checkoutProbe['data'],
        'order' => $order,
    ];
}

function probeStep(string $name, callable $operation, AppLogger $logger, OtlpHttpEmitter $emitter, array $rootSpan, array $extraAttributes = []): array
{
  global $requestId;

    $start = microtime(true);
    $span = $emitter->startSpan('php.component.' . $name, [
        'component.name' => $name,
        'component.type' => 'dependency',
    'request.id' => $requestId,
    ], $rootSpan, 3);

    try {
    $data = $operation($span);

        $emitter->exportTrace($emitter->finishSpan($span, array_merge([
            'component.name' => $name,
            'component.ok' => true,
            'duration_ms' => elapsedMs($start),
        ], $extraAttributes)));

        return ['ok' => true, 'data' => $data];
    } catch (Throwable $error) {
        $message = $error->getMessage();
      $errorContext = describeThrowable($error);

        $emitter->exportTrace($emitter->finishSpan($span, array_merge([
            'component.name' => $name,
            'component.ok' => false,
            'duration_ms' => elapsedMs($start),
            'error' => true,
      ], $extraAttributes, $errorContext), true, $message));

        $emitter->exportMetrics([
            $emitter->counter('php_component_errors_total', 1, ['component' => $name]),
            $emitter->histogram('php_component_error_duration_ms', elapsedMs($start), ['component' => $name]),
        ]);

        $logger->error('Component probe failed', [
            'component' => $name,
            'error' => $message,
            'span_id' => (string) ($span['spanId'] ?? ''),
            'request_id' => $requestId,
          'error_type' => (string) ($errorContext['error.type'] ?? ''),
          'error_function' => (string) ($errorContext['error.function'] ?? ''),
          'error_file' => (string) ($errorContext['error.file'] ?? ''),
          'error_line' => (int) ($errorContext['error.line'] ?? 0),
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

function appMysqlPdo(): PDO
{
  $options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION];
  if (defined('PDO::MYSQL_ATTR_USE_BUFFERED_QUERY')) {
    $options[PDO::MYSQL_ATTR_USE_BUFFERED_QUERY] = true;
  }

  return new PDO(
    getenv('MYSQL_DSN') ?: 'mysql:host=mysql;port=3306;dbname=catalog',
    getenv('MYSQL_USER') ?: 'app',
    getenv('MYSQL_PASSWORD') ?: 'app',
    $options
  );
}

function ensureAuthSchema(PDO $pdo): void
{
  static $initialized = false;
  if ($initialized) {
    return;
  }

  $pdo->exec(
    'CREATE TABLE IF NOT EXISTS app_users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
  );

  $initialized = true;
}

function isValidEmail(string $email): bool
{
  return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function normalizeEmail(string $email): string
{
  return strtolower(trim($email));
}

function jsonBody(): array
{
  $raw = file_get_contents('php://input');
  if ($raw === false || $raw === '') {
    return [];
  }

  $decoded = json_decode($raw, true);
  return is_array($decoded) ? $decoded : [];
}

function sendJson(int $status, array $payload): void
{
  http_response_code($status);
  header('Content-Type: application/json');
  echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}

function registerUser(string $email, string $password): array
{
  $pdo = appMysqlPdo();
  ensureAuthSchema($pdo);

  $check = $pdo->prepare('SELECT id FROM app_users WHERE email = :email LIMIT 1');
  $check->execute(['email' => $email]);
  $existing = $check->fetch(PDO::FETCH_ASSOC);
  $check->closeCursor();

  if (is_array($existing)) {
    return ['ok' => false];
  }

  $hash = password_hash($password, PASSWORD_DEFAULT);
  $insert = $pdo->prepare('INSERT INTO app_users (email, password_hash) VALUES (:email, :password_hash)');
  $insert->execute([
    'email' => $email,
    'password_hash' => $hash,
  ]);

  return ['ok' => true, 'user_id' => (int) $pdo->lastInsertId()];
}

function loginUser(string $email, string $password): ?array
{
  $pdo = appMysqlPdo();
  ensureAuthSchema($pdo);

  $stmt = $pdo->prepare('SELECT id, email, password_hash FROM app_users WHERE email = :email LIMIT 1');
  $stmt->execute(['email' => $email]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  $stmt->closeCursor();

  if (!is_array($row)) {
    return null;
  }

  if (!password_verify($password, (string) $row['password_hash'])) {
    return null;
  }

  return [
    'id' => (int) $row['id'],
    'email' => (string) $row['email'],
  ];
}

function setAuthenticatedUser(int $userId, string $email): void
{
  $_SESSION['user_id'] = $userId;
  $_SESSION['user_email'] = $email;
}

function clearAuthenticatedUser(): void
{
  unset($_SESSION['user_id'], $_SESSION['user_email']);
}

function currentAuthenticatedUser(): ?array
{
  if (!isset($_SESSION['user_id'], $_SESSION['user_email'])) {
    return null;
  }

  return [
    'id' => (int) $_SESSION['user_id'],
    'email' => (string) $_SESSION['user_email'],
  ];
}

function httpJson(string $url, bool $allowServerError = false, ?OtlpHttpEmitter $emitter = null, ?array $span = null): array
{
    global $http_response_header;
  global $requestId;

  $headers = [];
  if ($emitter !== null && $span !== null) {
    $traceparent = $emitter->traceparentForSpan($span);
    if ($traceparent !== '') {
      $headers[] = 'traceparent: ' . $traceparent;
    }
  }
  $headers[] = 'x-request-id: ' . $requestId;

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 3,
            'ignore_errors' => true,
      'header' => $headers,
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
    .btn-alert { background: #b42318; color: #fff; }
    .auth-card {
      border: 1px solid var(--line);
      border-radius: 14px;
      background: #fff;
      padding: 12px;
      display: grid;
      gap: 10px;
    }
    .auth-card h3 {
      margin: 0;
      font-family: Fraunces, serif;
      font-size: 1.1rem;
    }
    .auth-form {
      display: grid;
      gap: 8px;
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 10px;
      background: rgba(244, 234, 213, 0.25);
    }
    .auth-form label {
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .auth-user {
      border: 1px dashed var(--line);
      border-radius: 12px;
      padding: 10px;
      background: #fdfdfd;
      display: grid;
      gap: 8px;
    }
    .auth-status {
      margin: 0;
      font-size: 0.86rem;
      color: rgba(30, 41, 50, 0.8);
    }
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

        <div class="auth-card">
          <h3>Account</h3>
          <div id="auth-guest" style="display:grid; gap:8px;">
            <form id="form-register" class="auth-form">
              <label for="register-email">Registreren</label>
              <input id="register-email" name="email" type="email" placeholder="jij@voorbeeld.nl" required>
              <input id="register-password" name="password" type="password" placeholder="Wachtwoord (min. 8 tekens)" minlength="8" required>
              <button class="btn-main" type="submit">Register</button>
            </form>
            <form id="form-login" class="auth-form">
              <label for="login-email">Inloggen</label>
              <input id="login-email" name="email" type="email" placeholder="jij@voorbeeld.nl" required>
              <input id="login-password" name="password" type="password" placeholder="Wachtwoord" required>
              <button class="btn-sub" type="submit">Inloggen</button>
            </form>
          </div>
          <div id="auth-user" class="auth-user" hidden>
            <p class="auth-status">Ingelogd als <strong id="auth-email">-</strong></p>
            <button class="btn-clear" id="btn-logout">Uitloggen</button>
          </div>
        </div>

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
          <button class="btn-alert" id="btn-alert">Trigger alert</button>
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
    const authGuest = document.getElementById('auth-guest');
    const authUser = document.getElementById('auth-user');
    const authEmail = document.getElementById('auth-email');
    const registerForm = document.getElementById('form-register');
    const loginForm = document.getElementById('form-login');
    const logoutButton = document.getElementById('btn-logout');

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
        if (path === '/api/checkout') {
          const orderId = data && data.order && data.order.order_id ? data.order.order_id : 'UNKNOWN';
          const state = data && data.order && data.order.status ? data.order.status : 'confirmed';
          appendLog('checkout:order-confirmed', { order_id: orderId, status: state, trace_id: response.headers.get('x-trace-id') || '' });
        }
        appendLog(`${title} (${response.status})`, data);
      } catch (error) {
        const latency = performance.now() - start;
        setKpis(latency);
        appendLog(`${title} (network-fail)`, { error: error.message });
      }
    }

    async function requestJson(path, method, body) {
      const response = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });

      let payload = {};
      try {
        payload = await response.json();
      } catch (_error) {
        payload = {};
      }

      if (!response.ok) {
        const message = payload && payload.error ? payload.error : `Request failed (${response.status})`;
        throw new Error(message);
      }

      return payload;
    }

    function applyAuthState(authResponse) {
      const authenticated = Boolean(authResponse && authResponse.authenticated && authResponse.user);
      if (!authenticated) {
        authGuest.hidden = false;
        authUser.hidden = true;
        authEmail.textContent = '-';
        return;
      }

      const email = authResponse.user.email || '';
      authGuest.hidden = true;
      authUser.hidden = false;
      authEmail.textContent = email;

      if (typeof window.__setOpenObserveUser === 'function' && email) {
        window.__setOpenObserveUser({
          id: String(authResponse.user.id || email),
          name: email,
          email,
        });
      }
    }

    async function refreshAuthState() {
      try {
        const payload = await requestJson('/api/me', 'GET');
        applyAuthState(payload);
      } catch (error) {
        appendLog('auth:state-failed', { error: error.message });
      }
    }

    async function triggerAlertBurst() {
      const alertButton = document.getElementById('btn-alert');
      const burstSize = 8;
      alertButton.disabled = true;
      alertButton.textContent = 'Triggering...';

      appendLog('manual:alert-burst:start', { requests: burstSize, endpoint: '/api/error' });

      const jobs = Array.from({ length: burstSize }, (_, index) =>
        fetch('/api/error', { method: 'GET' })
          .then((response) => ({ ok: response.ok, status: response.status, index }))
          .catch((error) => ({ ok: false, status: 0, index, error: error.message }))
      );

      const results = await Promise.all(jobs);
      const statusCounts = results.reduce((acc, result) => {
        const key = String(result.status);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      appendLog('manual:alert-burst:done', {
        requests: burstSize,
        status_counts: statusCounts,
      });

      alertButton.disabled = false;
      alertButton.textContent = 'Trigger alert';
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

    document.getElementById('btn-alert').addEventListener('click', () => {
      triggerAlertBurst();
    });

    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('register-email').value.trim();
      const password = document.getElementById('register-password').value;

      try {
        const payload = await requestJson('/api/register', 'POST', { email, password });
        appendLog('auth:register-success', { email });
        applyAuthState({ authenticated: true, user: payload.user });
        registerForm.reset();
      } catch (error) {
        appendLog('auth:register-failed', { email, error: error.message });
      }
    });

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      try {
        const payload = await requestJson('/api/login', 'POST', { email, password });
        appendLog('auth:login-success', { email });
        applyAuthState({ authenticated: true, user: payload.user });
        loginForm.reset();
      } catch (error) {
        appendLog('auth:login-failed', { email, error: error.message });
      }
    });

    logoutButton.addEventListener('click', async () => {
      try {
        await requestJson('/api/logout', 'POST');
        appendLog('auth:logout-success', {});
        applyAuthState({ authenticated: false });
      } catch (error) {
        appendLog('auth:logout-failed', { error: error.message });
      }
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
    refreshAuthState();
    callApi('/api/summary', 'startup:summary');
  </script>
</body>
</html>
HTML;
}

function finishRootSpan(OtlpHttpEmitter $emitter, array $rootSpan, string $path, int $status, array $attributes = [], bool $error = false): void
{
  global $requestId;

    $baseAttributes = [
        'http.status_code' => $status,
        'http.route' => $path,
    'request.id' => $requestId,
    ];

    $emitter->exportTrace($emitter->finishSpan($rootSpan, array_merge($baseAttributes, $attributes), $error));
}

function finalize(string $path, int $status, float $requestStart, AppLogger $logger, OtlpHttpEmitter $emitter, array $rootSpan, string $message, array $extraAttributes = []): void
{
  global $requestId;

    $latency = elapsedMs($requestStart);
    $logger->info($message, [
        'path' => $path,
        'status' => $status,
        'duration_ms' => $latency,
    'request_id' => $requestId,
    ]);

    $span = $emitter->startSpan('php.finalize', ['http.route' => $path], $rootSpan);
    $emitter->exportTrace($emitter->finishSpan($span, array_merge([
        'http.status_code' => $status,
        'http.route' => $path,
        'http.method' => $_SERVER['REQUEST_METHOD'] ?? 'GET',
        'duration_ms' => $latency,
        'request.id' => $requestId,
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

function triggerIntentionalErrorPath(): void
{
  throw new RuntimeException('Intentional PHP error path triggered');
}

function describeThrowable(Throwable $error): array
{
  $function = '';
  foreach ($error->getTrace() as $frame) {
    if (!isset($frame['function'])) {
      continue;
    }
    $function = (string) $frame['function'];
    if ($function !== '{main}') {
      break;
    }
  }

  if ($function === '') {
    $function = '{unknown}';
  }

  return [
    'error.type' => get_class($error),
    'error.message' => $error->getMessage(),
    'error.function' => $function,
    'error.file' => $error->getFile(),
    'error.line' => $error->getLine(),
  ];
}
