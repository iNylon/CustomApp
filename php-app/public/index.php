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
  $resourceSnapshot = emitPhpProcessResourceTelemetry($path, 500, $logger, $emitter);

    http_response_code(500);
    header('Content-Type: application/json');

    $logger->error('Unhandled PHP exception', [
        'exception' => $e->getMessage(),
        'path' => $path,
    'cpu_percent' => $resourceSnapshot['cpu_percent'],
    'memory_usage_mb' => $resourceSnapshot['memory_usage_mb'],
    'memory_peak_mb' => $resourceSnapshot['memory_peak_mb'],
    'memory_rss_mb' => $resourceSnapshot['memory_rss_mb'],
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

    if ($path === '/auth') {
      header('Content-Type: text/html; charset=utf-8');
      echo renderAuthPage();
      finalize($path, 200, $requestStart, $logger, $emitter, $rootSpan, 'Rendered auth page');
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

    if ($path === '/api/orders' && $method === 'GET') {
      $user = currentAuthenticatedUser();
      if ($user === null) {
        sendJson(401, ['error' => 'Log eerst in om je bestellingen te zien.']);
        finalize($path, 401, $requestStart, $logger, $emitter, $rootSpan, 'Orders unauthorized');
        finishRootSpan($emitter, $rootSpan, $path, 401, ['auth.required' => true]);
        return;
      }

      $orders = listUserOrders((int) $user['id']);
      sendJson(200, ['orders' => $orders]);
      finalize($path, 200, $requestStart, $logger, $emitter, $rootSpan, 'Orders listed', ['order_count' => count($orders)]);
      finishRootSpan($emitter, $rootSpan, $path, 200, ['order_count' => count($orders), 'user.id' => (int) $user['id']]);
      return;
    }

    if ($path === '/api/error') {
      throw enrichThrowable(
        new RuntimeException('php storefront synthetic error endpoint triggered'),
        [
          'component.name' => 'php-storefront',
          'component.layer' => 'application',
          'fault.target' => 'php',
          'fault.synthetic' => true,
          'http.route' => $path,
          'request.id' => $requestId,
        ]
      );
    }

    if (preg_match('#^/api/fault/(mysql|postgres|redis|php|python|java|nodejs)$#', $path, $matches) === 1 && $method === 'POST') {
      $target = $matches[1];
      $payload = triggerFault($target, $logger, $emitter, $rootSpan);
      sendJson(200, $payload);
      finalize($path, 200, $requestStart, $logger, $emitter, $rootSpan, 'Fault trigger executed', [
        'fault.target' => $target,
        'fault.ok' => (bool) ($payload['ok'] ?? false),
      ]);
      finishRootSpan($emitter, $rootSpan, $path, 200, [
        'fault.target' => $target,
        'fault.ok' => (bool) ($payload['ok'] ?? false),
      ]);
      return;
    }

    if ($path === '/api/alert' && $method === 'POST') {
      $payload = triggerManualAlert($logger, $emitter, $rootSpan);
      sendJson(200, $payload);
      finalize($path, 200, $requestStart, $logger, $emitter, $rootSpan, 'Manual alert triggered', [
        'alert.name' => (string) ($payload['alert_name'] ?? ''),
        'alert.source' => (string) ($payload['source'] ?? ''),
        'alert.triggered' => true,
      ]);
      finishRootSpan($emitter, $rootSpan, $path, 200, [
        'alert.name' => (string) ($payload['alert_name'] ?? ''),
        'alert.source' => (string) ($payload['source'] ?? ''),
        'alert.triggered' => true,
      ]);
      return;
    }

    if ($path === '/api/summary' && $method === 'GET') {
      $payload = buildSummary($path, $logger, $emitter, $rootSpan);

        header('Content-Type: application/json');
        echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

      $status = $payload['degraded'] ? 206 : 200;
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

    if ($path === '/api/checkout' && $method === 'POST') {
      $user = currentAuthenticatedUser();
      if ($user === null) {
        sendJson(401, ['error' => 'Je moet ingelogd zijn om te bestellen.']);
        finalize($path, 401, $requestStart, $logger, $emitter, $rootSpan, 'Checkout unauthorized');
        finishRootSpan($emitter, $rootSpan, $path, 401, ['auth.required' => true]);
        return;
      }

      $payload = jsonBody();
      $cartItems = normalizeCheckoutCartItems($payload['items'] ?? []);
      if ($cartItems === []) {
        sendJson(422, ['error' => 'Je winkelwagen is leeg.']);
        finalize($path, 422, $requestStart, $logger, $emitter, $rootSpan, 'Checkout failed: empty cart');
        finishRootSpan($emitter, $rootSpan, $path, 422, ['checkout.success' => false]);
        return;
      }

      $order = createOrder((int) $user['id'], (string) $user['email'], $cartItems);
      $summary = buildSummary($path, $logger, $emitter, $rootSpan);
      $summary['checkout_success'] = true;
      $summary['order'] = $order;
      $summary['order_count'] = count($order['items']);
      $summary['order_total'] = $order['total_amount'];

      $logger->info('Order created', [
        'order_id' => $order['order_id'],
        'user_email' => $user['email'],
        'items' => count($order['items']),
        'total_amount' => $order['total_amount'],
      ]);
      $emitter->exportMetrics([
        $emitter->counter('php_orders_total', 1, ['status' => 'confirmed']),
        $emitter->histogram('php_order_value_eur', (float) $order['total_amount']),
      ]);

      header('Content-Type: application/json');
      echo json_encode($summary, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
      finalize($path, 200, $requestStart, $logger, $emitter, $rootSpan, 'Checkout completed', [
        'checkout.success' => true,
        'order.id' => (string) $order['order_id'],
        'order.total' => (float) $order['total_amount'],
        'user.email' => (string) $user['email'],
      ]);
      finishRootSpan($emitter, $rootSpan, $path, 200, [
        'checkout.success' => true,
        'order.id' => (string) $order['order_id'],
        'order.total' => (float) $order['total_amount'],
        'user.email' => (string) $user['email'],
      ]);
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

    $mysqlProbe = probeStep('mysql', fn (array $_span, array $_appSpan) => queryMysql(), $logger, $emitter, $rootSpan, [
      'component.layer' => 'infrastructure',
      'infra.kind' => 'database',
      'db.system' => 'mysql',
      'db.name' => 'catalog',
      'server.address' => getenv('MYSQL_HOST') ?: 'mysql',
    ], [
      'app.operation' => 'queryMysql',
      'code.function.name' => 'queryMysql',
      'code.file.path' => __FILE__,
    ]);
    $mysqlShadowProbe = probeStep('mysql_shadow', fn (array $_span, array $_appSpan) => queryMysql(), $logger, $emitter, $rootSpan, [
      'component.layer' => 'infrastructure',
      'infra.kind' => 'database',
      'db.system' => 'mysql',
      'db.name' => 'catalog',
      'server.address' => getenv('MYSQL_HOST') ?: 'mysql',
    ], [
      'app.operation' => 'queryMysql',
      'code.function.name' => 'queryMysql',
      'code.file.path' => __FILE__,
    ]);
    $postgresProbe = probeStep('postgres', fn (array $_span, array $_appSpan) => queryPostgres(), $logger, $emitter, $rootSpan, [
      'component.layer' => 'infrastructure',
      'infra.kind' => 'database',
      'db.system' => 'postgresql',
      'db.name' => 'recommendations',
      'server.address' => getenv('POSTGRES_HOST') ?: 'postgres',
    ], [
      'app.operation' => 'queryPostgres',
      'code.function.name' => 'queryPostgres',
      'code.file.path' => __FILE__,
    ]);
    $postgresShadowProbe = probeStep('postgres_shadow', fn (array $_span, array $_appSpan) => queryPostgres(), $logger, $emitter, $rootSpan, [
      'component.layer' => 'infrastructure',
      'infra.kind' => 'database',
      'db.system' => 'postgresql',
      'db.name' => 'recommendations',
      'server.address' => getenv('POSTGRES_HOST') ?: 'postgres',
    ], [
      'app.operation' => 'queryPostgres',
      'code.function.name' => 'queryPostgres',
      'code.file.path' => __FILE__,
    ]);
    $redisProbe = probeStep('redis', fn (array $_span, array $_appSpan) => queryRedis(), $logger, $emitter, $rootSpan, [
      'component.layer' => 'infrastructure',
      'infra.kind' => 'cache',
      'db.system' => 'redis',
      'server.address' => getenv('REDIS_HOST') ?: 'redis',
    ], [
      'app.operation' => 'queryRedis',
      'code.function.name' => 'queryRedis',
      'code.file.path' => __FILE__,
    ]);

    $catalogProbe = probeStep('node_catalog', fn (array $span, array $_appSpan) => httpJson((getenv('NODE_SERVICE_URL') ?: 'http://node-catalog:3000') . '/inventory', true, $emitter, $span), $logger, $emitter, $rootSpan, [
      'component.layer' => 'application',
      'peer.service' => 'node-catalog',
      'http.route' => '/inventory',
    ]);
    $recommendationsProbe = probeStep('python_recommendations', fn (array $span, array $_appSpan) => httpJson((getenv('PYTHON_SERVICE_URL') ?: 'http://python-recommendation:8000') . '/recommendations?user_id=1', true, $emitter, $span), $logger, $emitter, $rootSpan, [
      'component.layer' => 'application',
      'peer.service' => 'python-recommendation',
      'http.route' => '/recommendations',
    ]);
    $checkoutProbe = probeStep('java_checkout', fn (array $span, array $_appSpan) => httpJson((getenv('JAVA_SERVICE_URL') ?: 'http://java-checkout:8081') . '/quote', true, $emitter, $span), $logger, $emitter, $rootSpan, [
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

function probeStep(string $name, callable $operation, AppLogger $logger, OtlpHttpEmitter $emitter, array $rootSpan, array $extraAttributes = [], array $appAttributes = []): array
{
  global $requestId;

    $appSpan = $emitter->startSpan('php.application.' . $name, array_merge([
        'component.name' => $name,
        'component.type' => 'application_logic',
        'component.layer' => 'application',
        'request.id' => $requestId,
    ], $appAttributes), $rootSpan, 1);
    $start = microtime(true);
    $span = $emitter->startSpan('php.component.' . $name, [
        'component.name' => $name,
        'component.type' => 'dependency',
    'request.id' => $requestId,
    ], $appSpan, 3);

    try {
    $data = $operation($span, $appSpan);
      $telemetry = extractProbeTelemetry($data);

        $emitter->exportTrace($emitter->finishSpan($span, array_merge([
            'component.name' => $name,
            'component.ok' => true,
            'duration_ms' => elapsedMs($start),
        ], $extraAttributes, $telemetry)));
        $emitter->exportTrace($emitter->finishSpan($appSpan, array_merge([
            'component.name' => $name,
            'component.ok' => true,
            'duration_ms' => elapsedMs($start),
        ], $telemetry)));

        return ['ok' => true, 'data' => stripProbeTelemetry($data)];
    } catch (Throwable $error) {
        $message = $error->getMessage();
      $errorContext = describeThrowable($error);

        $emitter->exportTrace($emitter->finishSpan($span, array_merge([
            'component.name' => $name,
            'component.ok' => false,
            'duration_ms' => elapsedMs($start),
            'error' => true,
      ], $extraAttributes, $errorContext), true, $message));
        $emitter->exportTrace($emitter->finishSpan($appSpan, array_merge([
            'component.name' => $name,
            'component.ok' => false,
            'duration_ms' => elapsedMs($start),
            'error' => true,
        ], $errorContext), true, $message));

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

function extractProbeTelemetry(array $data): array
{
  $telemetry = $data['_telemetry'] ?? [];
  return is_array($telemetry) ? $telemetry : [];
}

function stripProbeTelemetry(array $data): array
{
  unset($data['_telemetry']);
  return $data;
}

function queryMysql(bool $forceFailure = false): array
{
    $queryStart = microtime(true);
    $connectStart = microtime(true);
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
    $connectionWaitMs = round((microtime(true) - $connectStart) * 1000, 2);

    $wasteQueries = 0;
    $transactionId = 'mysql-tx-' . bin2hex(random_bytes(4));
    $lockTarget = 'products.id=1';
    $operationSequence = [];
    $lastQueryType = 'read';
    $transactionStart = null;
    $statement = 'SELECT COUNT(*) AS product_count, SUM(inventory) AS inventory_total FROM products';
    $table = 'products';
    $operationName = 'SELECT';
    $rowsReturned = 0;
    $rowsAffected = 0;

    if (isDbBottleneckModeEnabled()) {
        try {
            $pdo->beginTransaction();
            $transactionStart = microtime(true);
            $operationSequence[] = 'begin_transaction';

            $statement = 'SELECT id FROM products WHERE id = 1 FOR UPDATE';
            $operationName = 'SELECT';
            $stmt = $pdo->query('SELECT id FROM products WHERE id = 1 FOR UPDATE');
            $lockedRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $rowsReturned = count($lockedRows);
            $stmt->closeCursor();
            $wasteQueries++;
            $lastQueryType = 'select_for_update';
            $operationSequence[] = 'lock_product_row';

            $statement = 'SELECT SLEEP(0.12) AS waited';
            $operationName = 'SELECT';
            $stmt = $pdo->query('SELECT SLEEP(0.12) AS waited');
            $stmt->fetchColumn();
            $rowsReturned = 1;
            $stmt->closeCursor();
            $wasteQueries++;
            $lastQueryType = 'sleep';
            $operationSequence[] = 'hold_lock';

            $categories = ['apparel', 'accessories', 'stationery'];
            for ($i = 0; $i < getDbBottleneckLoops(); $i++) {
                $category = $categories[$i % count($categories)];
                $statement = 'SELECT COUNT(*) FROM products WHERE category = :category';
                $operationName = 'SELECT';
                $stmt = $pdo->prepare('SELECT COUNT(*) FROM products WHERE category = :category');
                $stmt->execute(['category' => $category]);
                $stmt->fetchColumn();
                $rowsReturned = 1;
                $stmt->closeCursor();
                $wasteQueries++;
                $lastQueryType = 'select_count';
                $operationSequence[] = 'count_by_category:' . $category;
            }

            if ($forceFailure || random_int(1, 100) <= 14) {
                $durationMs = round((microtime(true) - $queryStart) * 1000, 2);
                throw buildDatabaseException(
                    'mysql lock wait timeout while loading catalog inventory',
                    array_merge([
                        'db.system' => 'mysql',
                        'db.query_type' => 'select_for_update',
                        'db.transaction_id' => $transactionId,
                        'db.lock_target' => $lockTarget,
                        'db.operation_sequence' => implode(' > ', $operationSequence),
                        'db.transaction.stage' => 'lock_contention',
                        ...databaseObservedAttributes(
                            $durationMs,
                            $connectionWaitMs,
                            $transactionStart,
                            $statement,
                            $table,
                            $operationName,
                            $rowsReturned,
                            $rowsAffected,
                            0,
                            $wasteQueries
                        ),
                    ], databasePerformanceAttributes(
                        $durationMs
                    ))
                );
            }

            $statement = 'SELECT COUNT(*) AS product_count, SUM(inventory) AS inventory_total FROM products';
            $operationName = 'SELECT';
            $stmt = $pdo->query('SELECT COUNT(*) AS product_count, SUM(inventory) AS inventory_total FROM products');
            $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
            $rowsReturned = $row === [] ? 0 : 1;
            $stmt->closeCursor();
            $lastQueryType = 'select_aggregate';
            $operationSequence[] = 'aggregate_inventory';

            $pdo->commit();
            $operationSequence[] = 'commit';
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
                $operationSequence[] = 'rollback';
            }
            throw enrichThrowable($e, [
                'db.system' => 'mysql',
                'db.query_type' => $lastQueryType,
                'db.transaction_id' => $transactionId,
                'db.lock_target' => $lockTarget,
                'db.operation_sequence' => implode(' > ', $operationSequence),
                ...databaseObservedAttributes(
                    round((microtime(true) - $queryStart) * 1000, 2),
                    $connectionWaitMs,
                    $transactionStart,
                    $statement,
                    $table,
                    $operationName,
                    $rowsReturned,
                    $rowsAffected,
                    0,
                    $wasteQueries
                ),
                ...databasePerformanceAttributes(
                    round((microtime(true) - $queryStart) * 1000, 2)
                ),
            ]);
        }
    } else {
        $statement = 'SELECT COUNT(*) AS product_count, SUM(inventory) AS inventory_total FROM products';
        $operationName = 'SELECT';
        $stmt = $pdo->query('SELECT COUNT(*) AS product_count, SUM(inventory) AS inventory_total FROM products');
        $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
        $rowsReturned = $row === [] ? 0 : 1;
        $stmt->closeCursor();
    }

    $durationMs = round((microtime(true) - $queryStart) * 1000, 2);
    return [
        'product_count' => (int) ($row['product_count'] ?? 0),
        'inventory_total' => (int) ($row['inventory_total'] ?? 0),
        'waste_queries' => $wasteQueries,
        '_telemetry' => array_merge(
            databaseObservedAttributes(
                $durationMs,
                $connectionWaitMs,
                $transactionStart,
                $statement,
                $table,
                $operationName,
                $rowsReturned,
                $rowsAffected,
                0,
                $wasteQueries
            ),
            databasePerformanceAttributes($durationMs)
        ),
    ];
}

function queryPostgres(bool $forceFailure = false): array
{
    $queryStart = microtime(true);
    $connectStart = microtime(true);
    $pdo = new PDO(
        getenv('POSTGRES_DSN') ?: 'pgsql:host=postgres;port=5432;dbname=recommendations',
        getenv('POSTGRES_USER') ?: 'app',
        getenv('POSTGRES_PASSWORD') ?: 'app',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $connectionWaitMs = round((microtime(true) - $connectStart) * 1000, 2);

    $wasteQueries = 0;
    $transactionId = 'postgres-tx-' . bin2hex(random_bytes(4));
    $lockTarget = 'users.id=1';
    $operationSequence = [];
    $lastQueryType = 'read';
    $transactionStart = null;
    $statement = 'SELECT COUNT(*) AS recommendation_count FROM recommendations';
    $table = 'recommendations';
    $operationName = 'SELECT';
    $rowsReturned = 0;
    $rowsAffected = 0;

    if (isDbBottleneckModeEnabled()) {
        try {
            $pdo->beginTransaction();
            $transactionStart = microtime(true);
            $operationSequence[] = 'begin_transaction';

            $statement = 'SELECT id FROM users WHERE id = 1 FOR UPDATE';
            $table = 'users';
            $operationName = 'SELECT';
            $stmt = $pdo->query('SELECT id FROM users WHERE id = 1 FOR UPDATE');
            $lockedRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $rowsReturned = count($lockedRows);
            $stmt->closeCursor();
            $wasteQueries++;
            $lastQueryType = 'select_for_update';
            $operationSequence[] = 'lock_user_row';

            $statement = 'SELECT pg_sleep(0.15)';
            $operationName = 'SELECT';
            $stmt = $pdo->query('SELECT pg_sleep(0.15)');
            $sleepRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $rowsReturned = count($sleepRows);
            $stmt->closeCursor();
            $wasteQueries++;
            $lastQueryType = 'sleep';
            $operationSequence[] = 'hold_lock';

            for ($i = 0; $i < getDbBottleneckLoops(); $i++) {
                $userId = ($i % 3) + 1;
                $statement = 'SELECT COUNT(*) FROM recommendations WHERE user_id = :user_id';
                $table = 'recommendations';
                $operationName = 'SELECT';
                $stmt = $pdo->prepare('SELECT COUNT(*) FROM recommendations WHERE user_id = :user_id');
                $stmt->execute(['user_id' => $userId]);
                $stmt->fetchColumn();
                $rowsReturned = 1;
                $stmt->closeCursor();
                $wasteQueries++;
                $lastQueryType = 'select_count';
                $operationSequence[] = 'count_recommendations:' . $userId;
            }

            if ($forceFailure || random_int(1, 100) <= 14) {
                $durationMs = round((microtime(true) - $queryStart) * 1000, 2);
                throw buildDatabaseException(
                    'postgres transaction deadlock while loading recommendations',
                    array_merge([
                        'db.system' => 'postgresql',
                        'db.query_type' => 'select_for_update',
                        'db.transaction_id' => $transactionId,
                        'db.lock_target' => $lockTarget,
                        'db.operation_sequence' => implode(' > ', $operationSequence),
                        'db.transaction.stage' => 'deadlock',
                        ...databaseObservedAttributes(
                            $durationMs,
                            $connectionWaitMs,
                            $transactionStart,
                            $statement,
                            $table,
                            $operationName,
                            $rowsReturned,
                            $rowsAffected,
                            0,
                            $wasteQueries
                        ),
                    ], databasePerformanceAttributes(
                        $durationMs
                    ))
                );
            }

            $statement = 'SELECT COUNT(*) AS recommendation_count FROM recommendations';
            $table = 'recommendations';
            $operationName = 'SELECT';
            $stmt = $pdo->query('SELECT COUNT(*) AS recommendation_count FROM recommendations');
            $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
            $rowsReturned = $row === [] ? 0 : 1;
            $stmt->closeCursor();
            $lastQueryType = 'select_aggregate';
            $operationSequence[] = 'aggregate_recommendations';

            $pdo->commit();
            $operationSequence[] = 'commit';
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
                $operationSequence[] = 'rollback';
            }
            throw enrichThrowable($e, [
                'db.system' => 'postgresql',
                'db.query_type' => $lastQueryType,
                'db.transaction_id' => $transactionId,
                'db.lock_target' => $lockTarget,
                'db.operation_sequence' => implode(' > ', $operationSequence),
                ...databaseObservedAttributes(
                    round((microtime(true) - $queryStart) * 1000, 2),
                    $connectionWaitMs,
                    $transactionStart,
                    $statement,
                    $table,
                    $operationName,
                    $rowsReturned,
                    $rowsAffected,
                    0,
                    $wasteQueries
                ),
                ...databasePerformanceAttributes(
                    round((microtime(true) - $queryStart) * 1000, 2)
                ),
            ]);
        }
    } else {
        $statement = 'SELECT COUNT(*) AS recommendation_count FROM recommendations';
        $table = 'recommendations';
        $operationName = 'SELECT';
        $stmt = $pdo->query('SELECT COUNT(*) AS recommendation_count FROM recommendations');
        $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
        $rowsReturned = $row === [] ? 0 : 1;
        $stmt->closeCursor();
    }

    $durationMs = round((microtime(true) - $queryStart) * 1000, 2);
    return [
        'recommendation_count' => (int) ($row['recommendation_count'] ?? 0),
        'waste_queries' => $wasteQueries,
        '_telemetry' => array_merge(
            databaseObservedAttributes(
                $durationMs,
                $connectionWaitMs,
                $transactionStart,
                $statement,
                $table,
                $operationName,
                $rowsReturned,
                $rowsAffected,
                0,
                $wasteQueries
            ),
            databasePerformanceAttributes($durationMs)
        ),
    ];
}

function queryRedis(bool $forceFailure = false): array
{
    $queryStart = microtime(true);
    $connectStart = microtime(true);
    $redis = new Redis();
    $redis->connect(getenv('REDIS_HOST') ?: 'redis', (int) (getenv('REDIS_PORT') ?: 6379), 1.5);
    $connectionWaitMs = round((microtime(true) - $connectStart) * 1000, 2);

    $loops = max(1, min((int) (getenv('APP_REDIS_BOTTLENECK_LOOPS') ?: 20), 200));
    $wasteOps = 0;
    $retryConflicts = 0;
    $statement = 'WATCH redis:hotspot:counter -> MULTI -> SET -> EXPIRE -> EXEC';
    $table = 'redis:hotspot:counter';
    $operationName = 'WATCH_MULTI_EXEC';

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

    if ($forceFailure || (isDbBottleneckModeEnabled() && $retryConflicts >= max(2, (int) floor($loops * 0.25)))) {
        throw enrichThrowable(new RuntimeException('redis transaction conflicts exceeded retry threshold'), [
            'db.system' => 'redis',
            'db.query_type' => 'watch_multi_exec',
            'db.transaction_id' => 'redis-tx-' . bin2hex(random_bytes(4)),
            'db.lock_target' => $hotKey,
            'db.operation_sequence' => 'watch > multi > set > expire > exec',
            ...databaseObservedAttributes(
                round((microtime(true) - $queryStart) * 1000, 2),
                $connectionWaitMs,
                $queryStart,
                $statement,
                $table,
                $operationName,
                0,
                0,
                $retryConflicts,
                $wasteOps
            ),
            ...databasePerformanceAttributes(
                round((microtime(true) - $queryStart) * 1000, 2)
            ),
        ]);
    }

    $durationMs = round((microtime(true) - $queryStart) * 1000, 2);
    return [
        'redis_ping' => $redis->ping(),
        'php_last_seen' => (string) $redis->get('php:last_seen'),
        'redis_waste_ops' => $wasteOps,
        'redis_tx_conflicts' => $retryConflicts,
        '_telemetry' => array_merge(
            databaseObservedAttributes(
                $durationMs,
                $connectionWaitMs,
                $queryStart,
                $statement,
                $table,
                $operationName,
                0,
                0,
                $retryConflicts,
                $wasteOps
            ),
            databasePerformanceAttributes($durationMs)
        ),
    ];
}

function databasePerformanceAttributes(float $durationMs): array
{
    return [
        'db.query.duration' => $durationMs,
        'db.response_time_ms' => $durationMs,
    ];
}

function databaseObservedAttributes(
    float $durationMs,
    float $connectionWaitMs,
    ?float $transactionStart,
    string $statement,
    string $table,
    string $operationName,
    int $rowsReturned,
    int $rowsAffected,
    int $retryCount,
    int $operationCount
): array {
    return [
        'db.connection.wait_ms' => $connectionWaitMs,
        'db.transaction.duration_ms' => $transactionStart !== null ? round((microtime(true) - $transactionStart) * 1000, 2) : $durationMs,
        'db.operation.name' => $operationName,
        'db.sql.table' => $table,
        'db.statement' => $statement,
        'db.rows_returned' => $rowsReturned,
        'db.rows_affected' => $rowsAffected,
        'db.retry_count' => $retryCount,
        'db.operation_count' => $operationCount,
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

  $pdo->exec(
    'CREATE TABLE IF NOT EXISTS app_orders (
      id INT PRIMARY KEY AUTO_INCREMENT,
      order_number VARCHAR(32) NOT NULL UNIQUE,
      user_id INT NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      status VARCHAR(32) NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_created (user_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
  );

  $pdo->exec(
    'CREATE TABLE IF NOT EXISTS app_order_items (
      id INT PRIMARY KEY AUTO_INCREMENT,
      order_id INT NOT NULL,
      sku VARCHAR(32) NOT NULL,
      product_name VARCHAR(128) NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      quantity INT NOT NULL,
      line_total DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_order_id (order_id)
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

function normalizeCheckoutCartItems(mixed $items): array
{
  if (!is_array($items)) {
    return [];
  }

  $normalized = [];
  foreach ($items as $item) {
    if (!is_array($item)) {
      continue;
    }

    $sku = strtoupper(trim((string) ($item['sku'] ?? '')));
    $quantity = (int) ($item['quantity'] ?? 0);
    if ($sku === '' || $quantity <= 0) {
      continue;
    }

    if (!isset($normalized[$sku])) {
      $normalized[$sku] = 0;
    }
    $normalized[$sku] += min($quantity, 99);
  }

  $result = [];
  foreach ($normalized as $sku => $quantity) {
    $result[] = ['sku' => $sku, 'quantity' => $quantity];
  }

  return $result;
}

function createOrder(int $userId, string $userEmail, array $cartItems): array
{
  $pdo = appMysqlPdo();
  ensureAuthSchema($pdo);

  $skus = array_map(static fn (array $item): string => (string) $item['sku'], $cartItems);
  $placeholders = implode(',', array_fill(0, count($skus), '?'));
  $stmt = $pdo->prepare('SELECT sku, name, price FROM products WHERE sku IN (' . $placeholders . ')');
  $stmt->execute($skus);
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
  $stmt->closeCursor();

  $catalog = [];
  foreach ($rows as $row) {
    $catalog[(string) $row['sku']] = $row;
  }

  $items = [];
  $total = 0.0;
  foreach ($cartItems as $item) {
    $sku = (string) $item['sku'];
    if (!isset($catalog[$sku])) {
      continue;
    }

    $name = (string) $catalog[$sku]['name'];
    $unit = (float) $catalog[$sku]['price'];
    $qty = (int) $item['quantity'];
    $line = round($unit * $qty, 2);
    $total += $line;
    $items[] = [
      'sku' => $sku,
      'name' => $name,
      'unit_price' => round($unit, 2),
      'quantity' => $qty,
      'line_total' => $line,
    ];
  }

  if ($items === []) {
    throw new RuntimeException('Geen geldige producten in winkelwagen.');
  }

  $orderNumber = 'ORD-' . strtoupper(bin2hex(random_bytes(4)));

  try {
    $pdo->beginTransaction();

    $insertOrder = $pdo->prepare('INSERT INTO app_orders (order_number, user_id, user_email, status, total_amount) VALUES (:order_number, :user_id, :user_email, :status, :total_amount)');
    $insertOrder->execute([
      'order_number' => $orderNumber,
      'user_id' => $userId,
      'user_email' => $userEmail,
      'status' => 'confirmed',
      'total_amount' => round($total, 2),
    ]);
    $orderId = (int) $pdo->lastInsertId();

    $insertItem = $pdo->prepare('INSERT INTO app_order_items (order_id, sku, product_name, unit_price, quantity, line_total) VALUES (:order_id, :sku, :product_name, :unit_price, :quantity, :line_total)');
    foreach ($items as $item) {
      $insertItem->execute([
        'order_id' => $orderId,
        'sku' => $item['sku'],
        'product_name' => $item['name'],
        'unit_price' => $item['unit_price'],
        'quantity' => $item['quantity'],
        'line_total' => $item['line_total'],
      ]);
    }

    $pdo->commit();
  } catch (Throwable $error) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    throw $error;
  }

  return [
    'order_id' => $orderNumber,
    'status' => 'confirmed',
    'total_amount' => round($total, 2),
    'items' => $items,
  ];
}

function listUserOrders(int $userId): array
{
  $pdo = appMysqlPdo();
  ensureAuthSchema($pdo);

  $ordersStmt = $pdo->prepare('SELECT id, order_number, status, total_amount, created_at FROM app_orders WHERE user_id = :user_id ORDER BY id DESC LIMIT 20');
  $ordersStmt->execute(['user_id' => $userId]);
  $orders = $ordersStmt->fetchAll(PDO::FETCH_ASSOC);
  $ordersStmt->closeCursor();

  if ($orders === []) {
    return [];
  }

  $orderIds = array_map(static fn (array $order): int => (int) $order['id'], $orders);
  $placeholders = implode(',', array_fill(0, count($orderIds), '?'));
  $itemsStmt = $pdo->prepare('SELECT order_id, sku, product_name, unit_price, quantity, line_total FROM app_order_items WHERE order_id IN (' . $placeholders . ') ORDER BY id ASC');
  $itemsStmt->execute($orderIds);
  $rows = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
  $itemsStmt->closeCursor();

  $itemsByOrder = [];
  foreach ($rows as $row) {
    $orderId = (int) $row['order_id'];
    if (!isset($itemsByOrder[$orderId])) {
      $itemsByOrder[$orderId] = [];
    }
    $itemsByOrder[$orderId][] = [
      'sku' => (string) $row['sku'],
      'name' => (string) $row['product_name'],
      'unit_price' => (float) $row['unit_price'],
      'quantity' => (int) $row['quantity'],
      'line_total' => (float) $row['line_total'],
    ];
  }

  $result = [];
  foreach ($orders as $order) {
    $id = (int) $order['id'];
    $result[] = [
      'order_id' => (string) $order['order_number'],
      'status' => (string) $order['status'],
      'total_amount' => (float) $order['total_amount'],
      'created_at' => (string) $order['created_at'],
      'items' => $itemsByOrder[$id] ?? [],
    ];
  }

  return $result;
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
  <title>Northstar Market | Storefront</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet">
  <script src="/rum-config.js"></script>
  <script src="/assets/app.js" defer></script>
  <style>
    :root {
      --bg-a: #f6efde;
      --bg-b: #d9ebe2;
      --ink: #19232c;
      --accent: #b85d15;
      --accent-soft: #f9dfc7;
      --line: rgba(25, 35, 44, 0.16);
      --ok: #1e6b5c;
      --warn: #b42318;
      --panel: rgba(255, 255, 255, 0.85);
      --shadow: 0 18px 40px rgba(25, 35, 44, 0.14);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Manrope, sans-serif;
      color: var(--ink);
      min-height: 100vh;
      background:
        radial-gradient(880px 420px at -10% -10%, rgba(184, 93, 21, 0.22), transparent 72%),
        radial-gradient(1000px 480px at 108% 8%, rgba(30, 107, 92, 0.24), transparent 74%),
        linear-gradient(145deg, var(--bg-a), var(--bg-b));
    }
    .shell {
      max-width: 1240px;
      margin: 0 auto;
      padding: 26px 18px 44px;
      display: grid;
      gap: 16px;
    }
    .hero {
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 20px;
      background: linear-gradient(140deg, rgba(255,255,255,0.95), rgba(255,255,255,0.78));
      box-shadow: var(--shadow);
      display: grid;
      gap: 10px;
    }
    .hero-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .hero h1 {
      margin: 0;
      font-family: Fraunces, serif;
      font-size: clamp(2rem, 4.8vw, 3.5rem);
      letter-spacing: -0.03em;
      line-height: 0.95;
    }
    .hero p {
      margin: 0;
      max-width: 75ch;
      line-height: 1.6;
      color: rgba(25, 35, 44, 0.86);
    }
    .user-chip {
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 8px 12px;
      font-size: 0.86rem;
      font-weight: 700;
      background: #fff;
    }
    .hero-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .hero-link {
      text-decoration: none;
      color: #fff;
      background: var(--accent);
      border-radius: 10px;
      padding: 8px 12px;
      font-weight: 700;
      font-size: 0.9rem;
    }
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1.45fr) minmax(0, 0.9fr);
      gap: 14px;
    }
    .layout > * {
      min-width: 0;
    }
    .panel {
      border: 1px solid var(--line);
      border-radius: 20px;
      background: var(--panel);
      box-shadow: 0 12px 22px rgba(25, 35, 44, 0.08);
    }
    .products {
      padding: 16px;
      display: grid;
      gap: 12px;
      align-content: start;
    }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      position: sticky;
      top: 12px;
      z-index: 6;
      padding: 4px 0 12px;
      background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92));
    }
    .toolbar > * {
      min-width: 0;
    }
    #search {
      flex: 1 1 320px;
      max-width: 100%;
      min-width: 0;
    }
    #category {
      flex: 0 0 210px;
      max-width: 210px;
    }
    input, select {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 11px;
      padding: 10px 12px;
      font: inherit;
      background: #fff;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 10px;
    }
    .sku {
      border: 1px solid var(--line);
      border-radius: 14px;
      overflow: hidden;
      background: #fff;
      display: grid;
      animation: rise .3s ease both;
    }
    .sku-img {
      width: 100%;
      aspect-ratio: 16 / 11;
      object-fit: cover;
      display: block;
    }
    .sku-body {
      padding: 10px;
      display: grid;
      gap: 8px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .badge {
      border-radius: 999px;
      background: var(--accent-soft);
      color: #62300d;
      font-size: 0.75rem;
      padding: 3px 8px;
      font-weight: 700;
      text-transform: capitalize;
    }
    .sku h3 {
      margin: 0;
      font-size: 1rem;
    }
    .sku p {
      margin: 0;
      font-size: 0.88rem;
      color: rgba(25, 35, 44, 0.8);
      min-height: 38px;
    }
    button {
      border: 0;
      border-radius: 10px;
      padding: 9px 11px;
      cursor: pointer;
      font: inherit;
      font-weight: 700;
      transition: transform .15s ease, filter .2s ease;
    }
    button:hover { transform: translateY(-1px); }
    button:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
    .btn-main { background: var(--accent); color: #fff; }
    .btn-sub { background: #1f685a; color: #fff; }
    .btn-clear { background: #ebebeb; color: #242424; }
    .side {
      padding: 14px;
      display: grid;
      gap: 10px;
      align-content: start;
    }
    .title {
      margin: 0;
      font-family: Fraunces, serif;
      font-size: 1.35rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pill {
      border-radius: 999px;
      font-size: 0.72rem;
      background: rgba(30, 107, 92, 0.2);
      color: var(--ok);
      padding: 2px 8px;
    }
    .kpi {
      display: grid;
      grid-template-columns: repeat(3, minmax(0,1fr));
      gap: 8px;
    }
    .kpi > div {
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #fff;
      text-align: center;
      padding: 9px;
    }
    .kpi strong {
      display: block;
      font-size: 1.1rem;
      margin-bottom: 2px;
    }
    .section-box {
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #fff;
      padding: 10px;
      display: grid;
      gap: 8px;
    }
    .mini-title {
      margin: 0;
      font-size: 0.82rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: rgba(25,35,44,0.7);
    }
    .cart-item {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px;
      background: #fff;
    }
    .checkout {
      display: grid;
      gap: 7px;
    }
    .fault-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    .fault-button {
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: flex-start;
      background: #fff;
      color: var(--ink);
      border: 1px solid var(--line);
      padding: 10px 12px;
      text-align: left;
    }
    .fault-button:hover {
      filter: brightness(0.98);
    }
    .alert-button {
      background: linear-gradient(135deg, #991b1b, #dc2626);
      color: #fff;
      border-color: #b91c1c;
    }
    .alert-button:hover {
      filter: brightness(1.05);
    }
    .rum-error-button {
      background: linear-gradient(135deg, #7c2d12, #ea580c);
      color: #fff;
      border-color: #c2410c;
    }
    .rum-error-button:hover {
      filter: brightness(1.05);
    }
    .tech-icon {
      flex: 0 0 32px;
      width: 32px;
      height: 32px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.72rem;
      font-weight: 800;
      color: #fff;
      letter-spacing: 0.01em;
    }
    .tech-icon.mysql { background: linear-gradient(135deg, #00546b, #0a88a8); }
    .tech-icon.postgres { background: linear-gradient(135deg, #1d4f91, #4b7ed1); }
    .tech-icon.redis { background: linear-gradient(135deg, #8d0e13, #d82c20); }
    .tech-icon.php { background: linear-gradient(135deg, #5f6fb2, #8892bf); }
    .tech-icon.alert { background: linear-gradient(135deg, #7f1d1d, #ef4444); }
    .tech-icon.rum { background: linear-gradient(135deg, #9a3412, #fb923c); }
    .tech-icon.python { background: linear-gradient(135deg, #3673a5, #ffd43b); color: #13233a; }
    .tech-icon.java { background: linear-gradient(135deg, #d66a2a, #f2a348); }
    .tech-icon.nodejs { background: linear-gradient(135deg, #2f7d32, #68a063); }
    .orders-list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 6px;
      font-size: 0.9rem;
    }
    .section-meta {
      margin: -2px 0 2px;
      font-size: 0.8rem;
      color: rgba(25,35,44,0.65);
    }
    .order-card {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 9px;
      background: #fff;
    }
    .order-head {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: baseline;
    }
    .order-meta, .order-items {
      margin: 4px 0 0;
      color: rgba(25,35,44,.72);
      font-size: 0.82rem;
      line-height: 1.45;
    }
    .orders-list {
      max-height: 380px;
      overflow: auto;
      padding-right: 2px;
    }
    .log {
      background: #0f1720;
      color: #e4ecf4;
      border-radius: 12px;
      min-height: 170px;
      max-height: 230px;
      overflow: auto;
      padding: 10px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.8rem;
      line-height: 1.35;
    }
    @keyframes rise {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 980px) {
      .layout { grid-template-columns: 1fr; }
      .hero-top { align-items: flex-start; }
      .toolbar {
        align-items: stretch;
      }
      #search {
        flex-basis: 100%;
      }
      #category {
        flex: 1 1 100%;
        max-width: 100%;
      }
      .fault-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <section class="hero">
      <div class="hero-top">
        <div>
          <h1>Northstar Market</h1>
          <p>Demo-webshop met echte login, orders en observability data. Je kunt alleen afrekenen als je ingelogd bent.</p>
        </div>
        <div class="hero-actions">
          <span class="user-chip" id="hero-user">Niet ingelogd</span>
          <a class="hero-link" id="auth-link" href="/auth">Inloggen / Registreren</a>
          <button class="btn-clear" id="btn-logout" hidden>Uitloggen</button>
        </div>
      </div>
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
        <h2 class="title">Winkelwagen <span class="pill">Live checkout</span></h2>

        <div class="kpi">
          <div><strong id="kpi-items">0</strong><span>Items</span></div>
          <div><strong id="kpi-subtotal">0.00</strong><span>Subtotal</span></div>
          <div><strong id="kpi-lat">-</strong><span>API ms</span></div>
        </div>

        <div class="section-box">
          <p class="mini-title">Cart</p>
          <div id="cart"></div>
        </div>

        <div class="checkout">
          <button class="btn-sub" id="btn-checkout">Bestelling afronden</button>
        </div>

        <div class="section-box">
          <p class="mini-title">Storingen simuleren</p>
          <div class="fault-grid" id="fault-grid">
            <button class="fault-button" data-fault="mysql"><span class="tech-icon mysql">My</span><span>Trigger MySQL fout</span></button>
            <button class="fault-button" data-fault="postgres"><span class="tech-icon postgres">PG</span><span>Trigger PostgreSQL fout</span></button>
            <button class="fault-button" data-fault="redis"><span class="tech-icon redis">R</span><span>Trigger Redis fout</span></button>
            <button class="fault-button" data-fault="php"><span class="tech-icon php">PHP</span><span>Trigger PHP fout</span></button>
            <button class="fault-button" data-fault="python"><span class="tech-icon python">Py</span><span>Trigger Python fout</span></button>
            <button class="fault-button" data-fault="java"><span class="tech-icon java">J</span><span>Trigger Java fout</span></button>
            <button class="fault-button" data-fault="nodejs"><span class="tech-icon nodejs">JS</span><span>Trigger NodeJS fout</span></button>
            <button class="fault-button alert-button" id="btn-generate-alert"><span class="tech-icon alert">!</span><span>Genereer alert</span></button>
            <button class="fault-button rum-error-button" id="btn-generate-rum-error"><span class="tech-icon rum">RUM</span><span>Genereer RUM error</span></button>
          </div>
        </div>

        <div class="section-box">
          <p class="mini-title">Mijn bestellingen</p>
          <p class="section-meta" id="orders-meta">Log in om je bestellingen te zien.</p>
          <ul class="orders-list" id="orders"><li>Log in om je bestellingen te zien.</li></ul>
        </div>

        <div class="log" id="log">Start webshop-simulatie: voeg producten toe en rond een bestelling af.</div>
      </aside>
    </section>
  </div>

  <script>
    const products = [
      { sku: 'SKU-100', name: 'PHP Hoodie', category: 'apparel', price: 59.99, desc: 'Warm en zacht, met mini-logo op de mouw.', image: 'https://picsum.photos/id/1011/640/440' },
      { sku: 'SKU-101', name: 'Node Mug', category: 'accessories', price: 12.49, desc: 'Keramische mok voor deploy-dagen.', image: 'https://picsum.photos/id/1062/640/440' },
      { sku: 'SKU-102', name: 'Python Notebook', category: 'stationery', price: 9.95, desc: 'Lijnpapier voor design en SQL-notes.', image: 'https://picsum.photos/id/180/640/440' },
      { sku: 'SKU-103', name: 'Java Sticker Pack', category: 'accessories', price: 4.99, desc: 'Retro stickers voor je laptop.', image: 'https://picsum.photos/id/30/640/440' },
      { sku: 'SKU-104', name: 'OTEL Cap', category: 'apparel', price: 19.99, desc: 'Lichte cap met trace icon.', image: 'https://picsum.photos/id/64/640/440' },
      { sku: 'SKU-105', name: 'Redis Socks', category: 'apparel', price: 14.95, desc: 'Snelle voeten voor snelle cache hits.', image: 'https://picsum.photos/id/21/640/440' },
    ];

    const cart = new Map();
    let currentUser = null;
    const grid = document.getElementById('grid');
    const cartBox = document.getElementById('cart');
    const ordersBox = document.getElementById('orders');
    const ordersMeta = document.getElementById('orders-meta');
    const logBox = document.getElementById('log');
    const heroUser = document.getElementById('hero-user');
    const authLink = document.getElementById('auth-link');
    const logoutButton = document.getElementById('btn-logout');
    const checkoutButton = document.getElementById('btn-checkout');
    const kpiItems = document.getElementById('kpi-items');
    const kpiSubtotal = document.getElementById('kpi-subtotal');
    const kpiLat = document.getElementById('kpi-lat');
    const searchInput = document.getElementById('search');
    const categoryInput = document.getElementById('category');
    const faultButtons = [...document.querySelectorAll('button[data-fault]')];
    const alertButton = document.getElementById('btn-generate-alert');
    const rumErrorButton = document.getElementById('btn-generate-rum-error');

    function euro(value) {
      return Number(value).toFixed(2);
    }

    function appendLog(title, payload) {
      const stamp = new Date().toISOString();
      const lines = [`[${stamp}] ${title}`];
      if (payload !== undefined) {
        lines.push(JSON.stringify(payload, null, 2));
      }
      logBox.textContent = `${lines.join('\n')}\n\n${logBox.textContent}`.slice(0, 9000);
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

    function cartPayload() {
      return [...cart.entries()].filter(([, qty]) => qty > 0).map(([sku, quantity]) => ({ sku, quantity }));
    }

    function setKpis(latencyMs) {
      kpiItems.textContent = String(totalItems());
      kpiSubtotal.textContent = euro(subtotal());
      if (typeof latencyMs === 'number') {
        kpiLat.textContent = String(Math.round(latencyMs));
      }
    }

    function renderCart() {
      const entries = cartPayload();
      if (entries.length === 0) {
        cartBox.innerHTML = '<p style="margin:0;color:rgba(25,35,44,.7)">Nog geen items in je winkelwagen.</p>';
        setKpis();
        return;
      }

      cartBox.innerHTML = entries.map(({ sku, quantity }) => {
        const item = products.find((p) => p.sku === sku);
        const lineTotal = item ? item.price * quantity : 0;
        return `
          <div class="cart-item">
            <div>
              <strong>${item ? item.name : sku}</strong>
              <div style="font-size:.8rem;color:rgba(25,35,44,.68)">x${quantity}</div>
            </div>
            <strong>EUR ${euro(lineTotal)}</strong>
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
          <img class="sku-img" src="${item.image}" alt="${item.name}">
          <div class="sku-body">
            <div class="row">
              <h3>${item.name}</h3>
              <span class="badge">${item.category}</span>
            </div>
            <p>${item.desc}</p>
            <div class="row">
              <strong>EUR ${euro(item.price)}</strong>
              <button class="btn-main" data-sku="${item.sku}">Toevoegen</button>
            </div>
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

    async function requestJson(path, method = 'GET', body) {
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

      return { payload, status: response.status };
    }

    function renderOrders(orders) {
      if (!currentUser) {
        ordersMeta.textContent = 'Log in om je bestellingen te zien.';
        ordersBox.innerHTML = '<li>Log in om je bestellingen te zien.</li>';
        return;
      }
      if (!orders || orders.length === 0) {
        ordersMeta.textContent = 'Nog geen bestellingen geplaatst.';
        ordersBox.innerHTML = '<li>Nog geen bestellingen geplaatst.</li>';
        return;
      }

      ordersMeta.textContent = `${orders.length} bestellingen geladen. Nieuwste bovenaan.`;
      ordersBox.innerHTML = orders.map((order) => `
        <li class="order-card">
          <div class="order-head">
            <strong>${order.order_id}</strong>
            <span>${order.status}</span>
          </div>
          <p class="order-meta">EUR ${euro(order.total_amount)} • ${new Date(order.created_at).toLocaleString()} • ${order.items.length} regels</p>
          <div class="order-items">${order.items.map((item) => `${item.quantity}x ${item.name} (${item.sku})`).join(' • ')}</div>
        </li>
      `).join('');
    }

    function applyAuthState(data) {
      if (!data || !data.authenticated || !data.user) {
        currentUser = null;
        heroUser.textContent = 'Niet ingelogd';
        authLink.hidden = false;
        logoutButton.hidden = true;
        checkoutButton.disabled = false;
        checkoutButton.title = 'Log in om je bestelling af te ronden';
        ordersMeta.textContent = 'Log in om je bestellingen te zien.';
        renderOrders([]);
        return;
      }

      currentUser = data.user;
      heroUser.textContent = `Ingelogd als ${data.user.email}`;
      authLink.hidden = true;
      logoutButton.hidden = false;
      checkoutButton.disabled = false;
      checkoutButton.title = '';

      if (typeof window.__setOpenObserveUser === 'function') {
        window.__setOpenObserveUser({
          id: String(data.user.id || data.user.email),
          name: data.user.email,
          email: data.user.email,
        });
      }
    }

    async function refreshAuthState() {
      try {
        const { payload } = await requestJson('/api/me');
        applyAuthState(payload);
      } catch (error) {
        appendLog('auth:state-failed', { error: error.message });
      }
    }

    async function refreshOrders() {
      if (!currentUser) {
        renderOrders([]);
        return;
      }

      try {
        const { payload } = await requestJson('/api/orders');
        renderOrders(payload.orders || []);
      } catch (error) {
        appendLog('orders:load-failed', { error: error.message });
      }
    }

    async function triggerFault(target, button) {
      const original = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `${original}`;
      try {
        const { payload } = await requestJson(`/api/fault/${target}`, 'POST');
        appendLog('fault:triggered', {
          target,
          ok: payload.ok,
          error: payload.error || '',
          status_code: payload.status_code || 0,
        });
      } catch (error) {
        appendLog('fault:trigger-failed', { target, error: error.message });
      } finally {
        button.disabled = false;
        button.innerHTML = original;
      }
    }

    async function triggerAlert(button) {
      const original = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `${original}`;
      try {
        const { payload } = await requestJson('/api/alert', 'POST');
        appendLog('alert:triggered', {
          alert_name: payload.alert_name,
          source: payload.source,
          triggered_at: payload.triggered_at,
        });
      } catch (error) {
        appendLog('alert:trigger-failed', { error: error.message });
      } finally {
        button.disabled = false;
        button.innerHTML = original;
      }
    }

    function triggerRumError(button) {
      const original = button.innerHTML;
      const rumState = window.__OPENOBSERVE_RUM_STATE__ || {};
      button.disabled = true;
      button.innerHTML = `${original}`;

      appendLog('rum:error-triggered', {
        initialized: Boolean(rumState.initialized),
        service: rumState.service || '',
        message: 'Manual RUM test error scheduled',
      });

      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = original;

        const error = new Error('Manual RUM test error from storefront button');
        error.name = 'ManualRumTestError';
        throw error;
      }, 25);
    }

    async function checkoutOrder() {
      if (!currentUser) {
        appendLog('checkout:blocked', { reason: 'not-authenticated' });
        window.location.href = '/auth?next=/';
        return;
      }

      const items = cartPayload();
      if (items.length === 0) {
        appendLog('checkout:blocked', { reason: 'empty-cart' });
        return;
      }

      const start = performance.now();
      try {
        const { payload } = await requestJson('/api/checkout', 'POST', { items });
        setKpis(performance.now() - start);
        const order = payload.order || {};
        appendLog('checkout:order-confirmed', {
          order_id: order.order_id,
          status: order.status,
          total_amount: order.total_amount,
          user_email: currentUser.email,
        });
        cart.clear();
        renderCart();
        await refreshOrders();
      } catch (error) {
        setKpis(performance.now() - start);
        appendLog('checkout:failed', { error: error.message });
      }
    }

    document.getElementById('btn-checkout').addEventListener('click', () => {
      checkoutOrder();
    });

    faultButtons.forEach((button) => {
      button.addEventListener('click', () => {
        triggerFault(button.getAttribute('data-fault'), button);
      });
    });

    alertButton.addEventListener('click', () => {
      triggerAlert(alertButton);
    });

    rumErrorButton.addEventListener('click', () => {
      triggerRumError(rumErrorButton);
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
    });

    categoryInput.addEventListener('change', () => {
      renderGrid();
    });

    renderGrid();
    renderCart();
    refreshAuthState().then(() => refreshOrders());
  </script>
</body>
</html>
HTML;
}

function renderAuthPage(): string
{
  return <<<'HTML'
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Northstar Market | Inloggen</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet">
  <script src="/rum-config.js"></script>
  <script src="/assets/app.js" defer></script>
  <style>
    :root {
      --line: rgba(25, 35, 44, 0.16);
      --accent: #b85d15;
      --ok: #1f685a;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Manrope, sans-serif;
      background: linear-gradient(140deg, #f6efde, #d9ebe2);
      color: #19232c;
      display: grid;
      place-items: center;
      padding: 14px;
    }
    .auth-shell {
      width: min(920px, 100%);
      border: 1px solid var(--line);
      border-radius: 24px;
      background: rgba(255,255,255,0.94);
      box-shadow: 0 20px 45px rgba(25,35,44,0.14);
      padding: 20px;
      display: grid;
      gap: 14px;
    }
    .top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    h1 {
      margin: 0;
      font-family: Fraunces, serif;
      font-size: clamp(1.8rem, 4vw, 2.8rem);
      letter-spacing: -0.03em;
    }
    .home-link {
      text-decoration: none;
      font-weight: 700;
      color: #fff;
      background: #19232c;
      border-radius: 10px;
      padding: 8px 12px;
    }
    .cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    form {
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 14px;
      background: #fff;
      display: grid;
      gap: 8px;
    }
    label {
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: rgba(25,35,44,.74);
    }
    input {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 11px;
      padding: 10px 11px;
      font: inherit;
    }
    button {
      border: 0;
      border-radius: 10px;
      padding: 10px 12px;
      cursor: pointer;
      font: inherit;
      font-weight: 700;
    }
    .btn-register { background: var(--accent); color: #fff; }
    .btn-login { background: var(--ok); color: #fff; }
    .status {
      border: 1px dashed var(--line);
      border-radius: 12px;
      padding: 10px;
      background: #fdfdfd;
      font-size: 0.9rem;
    }
    @media (max-width: 860px) {
      .cols { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="auth-shell">
    <div class="top">
      <h1>Inloggen of registreren</h1>
      <a class="home-link" href="/">Terug naar shop</a>
    </div>

    <p style="margin:0;color:rgba(25,35,44,.82)">Na inloggen kun je meteen producten bestellen. Je e-mailadres wordt expres in telemetry meegestuurd voor SDR/redactie-tests.</p>

    <section class="cols">
      <form id="register-form">
        <strong>Nieuw account</strong>
        <label for="register-email">E-mailadres</label>
        <input id="register-email" type="email" required placeholder="jij@voorbeeld.nl">
        <label for="register-password">Wachtwoord</label>
        <input id="register-password" type="password" minlength="8" required placeholder="Minimaal 8 tekens">
        <button class="btn-register" type="submit">Account aanmaken</button>
      </form>

      <form id="login-form">
        <strong>Bestaand account</strong>
        <label for="login-email">E-mailadres</label>
        <input id="login-email" type="email" required placeholder="jij@voorbeeld.nl">
        <label for="login-password">Wachtwoord</label>
        <input id="login-password" type="password" required placeholder="Wachtwoord">
        <button class="btn-login" type="submit">Inloggen</button>
      </form>
    </section>

    <div class="status" id="auth-status">Nog niet ingelogd.</div>
  </main>

  <script>
    const params = new URLSearchParams(window.location.search);
    const nextPath = params.get('next') || '/';
    const statusBox = document.getElementById('auth-status');

    function setStatus(message) {
      statusBox.textContent = message;
    }

    async function requestJson(path, method = 'GET', body) {
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

    async function refreshCurrentUser() {
      try {
        const payload = await requestJson('/api/me');
        if (payload.authenticated && payload.user) {
          setStatus(`Ingelogd als ${payload.user.email}. Je wordt nu doorgestuurd...`);

          if (typeof window.__setOpenObserveUser === 'function') {
            window.__setOpenObserveUser({
              id: String(payload.user.id || payload.user.email),
              name: payload.user.email,
              email: payload.user.email,
            });
          }

          setTimeout(() => {
            window.location.href = nextPath;
          }, 700);
          return;
        }
      } catch (_error) {
        // ignore and let forms handle explicit actions
      }
    }

    document.getElementById('register-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('register-email').value.trim();
      const password = document.getElementById('register-password').value;
      try {
        const payload = await requestJson('/api/register', 'POST', { email, password });
        setStatus(`Account aangemaakt voor ${payload.user.email}.`);
        await refreshCurrentUser();
      } catch (error) {
        setStatus(`Registreren mislukt: ${error.message}`);
      }
    });

    document.getElementById('login-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      try {
        const payload = await requestJson('/api/login', 'POST', { email, password });
        setStatus(`Welkom terug, ${payload.user.email}.`);
        await refreshCurrentUser();
      } catch (error) {
        setStatus(`Inloggen mislukt: ${error.message}`);
      }
    });

    refreshCurrentUser();
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

    $resourceSnapshot = emitPhpProcessResourceTelemetry($path, $status, $logger, $emitter);
    $latency = elapsedMs($requestStart);
    $logger->info($message, [
        'path' => $path,
        'status' => $status,
        'duration_ms' => $latency,
    'cpu_percent' => $resourceSnapshot['cpu_percent'],
    'memory_usage_mb' => $resourceSnapshot['memory_usage_mb'],
    'memory_peak_mb' => $resourceSnapshot['memory_peak_mb'],
    'memory_rss_mb' => $resourceSnapshot['memory_rss_mb'],
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

function emitPhpProcessResourceTelemetry(string $path, int $status, AppLogger $logger, OtlpHttpEmitter $emitter): array
{
    $snapshot = samplePhpProcessResources();
    $pid = getmypid();
    $attrs = [
        'scope' => 'request',
        'component' => 'runtime',
        'pid' => $pid === false ? 0 : $pid,
        'route' => $path,
        'status' => $status,
    ];

    $emitter->exportMetrics([
        $emitter->histogram('php_process_cpu_percent', $snapshot['cpu_percent'], $attrs, 'percent', [5.0, 10.0, 25.0, 50.0, 75.0, 100.0, 150.0]),
        $emitter->histogram('php_process_memory_usage_mb', $snapshot['memory_usage_mb'], $attrs, 'MB', [16.0, 32.0, 64.0, 128.0, 256.0, 512.0]),
        $emitter->histogram('php_process_memory_peak_mb', $snapshot['memory_peak_mb'], $attrs, 'MB', [16.0, 32.0, 64.0, 128.0, 256.0, 512.0]),
        $emitter->histogram('php_process_memory_rss_mb', $snapshot['memory_rss_mb'], $attrs, 'MB', [16.0, 32.0, 64.0, 128.0, 256.0, 512.0]),
    ]);

    $warnCpuPercent = (float) (getenv('APP_RESOURCE_WARN_CPU_PERCENT') ?: 35.0);
    $warnMemoryMb = (float) (getenv('APP_RESOURCE_WARN_MEMORY_MB') ?: 180.0);
    $thresholdExceeded = $snapshot['cpu_percent'] >= $warnCpuPercent || $snapshot['memory_rss_mb'] >= $warnMemoryMb || $snapshot['memory_usage_mb'] >= $warnMemoryMb;

    if ($thresholdExceeded) {
        $logger->warn('php resource threshold exceeded', [
            'path' => $path,
            'status' => $status,
            'pid' => $pid === false ? 0 : $pid,
            'cpu_percent' => $snapshot['cpu_percent'],
            'memory_usage_mb' => $snapshot['memory_usage_mb'],
            'memory_peak_mb' => $snapshot['memory_peak_mb'],
            'memory_rss_mb' => $snapshot['memory_rss_mb'],
            'cpu_warn_percent' => $warnCpuPercent,
            'memory_warn_mb' => $warnMemoryMb,
        ]);
    }

    return $snapshot;
}

function samplePhpProcessResources(): array
{
    static $lastCpuSeconds = null;
    static $lastWallTime = null;

    $usage = getrusage();
    $cpuSeconds = cpuUsageSeconds($usage);
    $wallTime = microtime(true);
    $cpuPercent = 0.0;

    if ($lastCpuSeconds !== null && $lastWallTime !== null) {
        $wallDelta = max($wallTime - $lastWallTime, 1e-9);
        $cpuDelta = max($cpuSeconds - $lastCpuSeconds, 0.0);
        $cpuPercent = round(($cpuDelta / $wallDelta) * 100, 2);
    }

    $lastCpuSeconds = $cpuSeconds;
    $lastWallTime = $wallTime;

    return [
        'cpu_percent' => $cpuPercent,
        'memory_usage_mb' => round(memory_get_usage(true) / 1048576, 2),
        'memory_peak_mb' => round(memory_get_peak_usage(true) / 1048576, 2),
        'memory_rss_mb' => readProcStatusMb('VmRSS'),
    ];
}

function cpuUsageSeconds(array $usage): float
{
    $userSeconds = (float) (($usage['ru_utime.tv_sec'] ?? 0) + (($usage['ru_utime.tv_usec'] ?? 0) / 1000000));
    $systemSeconds = (float) (($usage['ru_stime.tv_sec'] ?? 0) + (($usage['ru_stime.tv_usec'] ?? 0) / 1000000));

    return $userSeconds + $systemSeconds;
}

function readProcStatusMb(string $metric): float
{
    $status = @file_get_contents('/proc/self/status');
    if ($status === false) {
        return 0.0;
    }

    if (preg_match('/^' . preg_quote($metric, '/') . ':\s+(\d+)\s+kB$/m', $status, $matches) !== 1) {
        return 0.0;
    }

    return round(((float) $matches[1]) / 1024, 2);
}

function triggerFault(string $target, AppLogger $logger, OtlpHttpEmitter $emitter, array $rootSpan): array
{
  return match ($target) {
    'mysql' => triggerProbeFault('mysql', fn (array $_span, array $_appSpan) => queryMysql(true), $logger, $emitter, $rootSpan, [
      'component.layer' => 'infrastructure',
      'infra.kind' => 'database',
      'db.system' => 'mysql',
      'db.name' => 'catalog',
      'server.address' => getenv('MYSQL_HOST') ?: 'mysql',
    ], [
      'app.operation' => 'queryMysql',
      'code.function.name' => 'queryMysql',
      'code.file.path' => __FILE__,
    ]),
    'postgres' => triggerProbeFault('postgres', fn (array $_span, array $_appSpan) => queryPostgres(true), $logger, $emitter, $rootSpan, [
      'component.layer' => 'infrastructure',
      'infra.kind' => 'database',
      'db.system' => 'postgresql',
      'db.name' => 'recommendations',
      'server.address' => getenv('POSTGRES_HOST') ?: 'postgres',
    ], [
      'app.operation' => 'queryPostgres',
      'code.function.name' => 'queryPostgres',
      'code.file.path' => __FILE__,
    ]),
    'redis' => triggerProbeFault('redis', fn (array $_span, array $_appSpan) => queryRedis(true), $logger, $emitter, $rootSpan, [
      'component.layer' => 'infrastructure',
      'infra.kind' => 'cache',
      'db.system' => 'redis',
      'server.address' => getenv('REDIS_HOST') ?: 'redis',
    ], [
      'app.operation' => 'queryRedis',
      'code.function.name' => 'queryRedis',
      'code.file.path' => __FILE__,
    ]),
    'php' => triggerPhpFault($logger, $emitter, $rootSpan),
    'python' => triggerDownstreamFault('python', (getenv('PYTHON_SERVICE_URL') ?: 'http://python-recommendation:8000') . '/recommendations?user_id=1&fail=1', $logger, $emitter, $rootSpan, [
      'component.layer' => 'application',
      'peer.service' => 'python-recommendation',
      'http.route' => '/recommendations',
    ]),
    'java' => triggerDownstreamFault('java', (getenv('JAVA_SERVICE_URL') ?: 'http://java-checkout:8081') . '/quote?fail=1', $logger, $emitter, $rootSpan, [
      'component.layer' => 'application',
      'peer.service' => 'java-checkout',
      'http.route' => '/quote',
    ]),
    'nodejs' => triggerDownstreamFault('nodejs', (getenv('NODE_SERVICE_URL') ?: 'http://node-catalog:3000') . '/inventory?fail=1', $logger, $emitter, $rootSpan, [
      'component.layer' => 'application',
      'peer.service' => 'node-catalog',
      'http.route' => '/inventory',
    ]),
    default => ['ok' => false, 'target' => $target, 'error' => 'Onbekende fouttrigger.'],
  };
}

function triggerManualAlert(AppLogger $logger, OtlpHttpEmitter $emitter, array $rootSpan): array
{
  global $requestId;

  $alertName = 'manual_storefront_button';
  $source = 'storefront_ui';
  $triggeredAt = gmdate(DATE_ATOM);
  $span = $emitter->startSpan('php.application.manual_alert', [
    'component.name' => 'alerting',
    'component.type' => 'application_logic',
    'component.layer' => 'application',
    'request.id' => $requestId,
    'alert.name' => $alertName,
    'alert.source' => $source,
  ], $rootSpan, 1);

  $emitter->exportMetrics([
    $emitter->counter('php_manual_alerts_total', 1, [
      'alert_name' => $alertName,
      'source' => $source,
    ]),
  ]);

  $emitter->exportTrace($emitter->finishSpan($span, [
    'alert.name' => $alertName,
    'alert.source' => $source,
    'alert.triggered' => true,
    'alert.triggered_at' => $triggeredAt,
  ]));

  $logger->warn('Manual alert trigger fired', [
    'request_id' => $requestId,
    'alert_name' => $alertName,
    'source' => $source,
    'triggered_at' => $triggeredAt,
  ]);

  return [
    'ok' => true,
    'alert_name' => $alertName,
    'source' => $source,
    'triggered_at' => $triggeredAt,
  ];
}

function triggerProbeFault(string $name, callable $operation, AppLogger $logger, OtlpHttpEmitter $emitter, array $rootSpan, array $extraAttributes, array $appAttributes = []): array
{
  $probe = probeStep($name, $operation, $logger, $emitter, $rootSpan, $extraAttributes, $appAttributes);

  return [
    'ok' => $probe['ok'],
    'target' => $name,
    'error' => (string) ($probe['data']['error'] ?? ''),
  ];
}

function triggerPhpFault(AppLogger $logger, OtlpHttpEmitter $emitter, array $rootSpan): array
{
  global $requestId;

  $span = $emitter->startSpan('php.application.manual_fault', [
    'component.name' => 'php',
    'component.type' => 'application_logic',
    'component.layer' => 'application',
    'request.id' => $requestId,
    'code.function.name' => 'triggerPhpFault',
    'code.file.path' => __FILE__,
  ], $rootSpan, 1);

  try {
    throw new RuntimeException('php storefront failed while preparing checkout context');
  } catch (Throwable $error) {
    $errorContext = describeThrowable($error);
    $emitter->exportTrace($emitter->finishSpan($span, array_merge([
      'component.ok' => false,
      'error' => true,
    ], $errorContext), true, $error->getMessage()));
    $logger->error('PHP fault triggered', [
      'error' => $error->getMessage(),
      'request_id' => $requestId,
      'error_file' => (string) ($errorContext['error.file'] ?? ''),
      'error_function' => (string) ($errorContext['error.function'] ?? ''),
      'error_line' => (int) ($errorContext['error.line'] ?? 0),
    ]);

    return [
      'ok' => false,
      'target' => 'php',
      'error' => $error->getMessage(),
    ];
  }
}

function triggerDownstreamFault(string $target, string $url, AppLogger $logger, OtlpHttpEmitter $emitter, array $rootSpan, array $extraAttributes = []): array
{
  $probe = probeStep($target, fn (array $span, array $_appSpan) => httpJson($url, true, $emitter, $span), $logger, $emitter, $rootSpan, $extraAttributes);
  $data = $probe['data'] ?? [];

  return [
    'ok' => false,
    'target' => $target,
    'status_code' => (int) ($data['status_code'] ?? 503),
    'error' => (string) (($data['payload']['error'] ?? $data['status_line'] ?? 'Downstream fout geactiveerd')),
  ];
}

function buildDatabaseException(string $message, array $context = []): RuntimeException
{
  return enrichThrowable(new RuntimeException($message), $context);
}

function enrichThrowable(Throwable $error, array $context = []): RuntimeException
{
  if ($context === []) {
    if ($error instanceof RuntimeException) {
      return $error;
    }
    return new RuntimeException($error->getMessage(), 0, $error);
  }

  return new RuntimeException($error->getMessage(), 0, new ErrorContextException($context, $error));
}

final class ErrorContextException extends RuntimeException
{
  public function __construct(
    private readonly array $context,
    ?Throwable $previous = null,
  ) {
    parent::__construct('error_context', 0, $previous);
  }

  public function context(): array
  {
    return $this->context;
  }
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

  $context = extractThrowableContext($error);
  $errorCode = is_int($error->getCode()) || is_string($error->getCode()) ? (string) $error->getCode() : '';

  return [
    'error.type' => get_class($error),
    'error.code' => $errorCode,
    'error.message' => $error->getMessage(),
    'error.function' => $function,
    'error.file' => $error->getFile(),
    'error.line' => $error->getLine(),
    'exception.type' => get_class($error),
    'exception.code' => $errorCode,
    'exception.message' => $error->getMessage(),
    'exception.stacktrace' => $error->getTraceAsString(),
    'code.function.name' => $function,
    'code.file.path' => $error->getFile(),
    'code.line.number' => $error->getLine(),
    ...$context,
  ];
}

function extractThrowableContext(Throwable $error): array
{
  $current = $error;
  while ($current !== null) {
    if ($current instanceof ErrorContextException) {
      return $current->context();
    }
    $current = $current->getPrevious();
  }

  return [];
}
