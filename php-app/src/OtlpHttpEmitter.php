<?php

declare(strict_types=1);

final class OtlpHttpEmitter
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly array $resourceAttributes,
        private readonly bool $enabled = true,
    ) {
    }

    public function exportTrace(array $span): void
    {
        if (!$this->enabled) {
            return;
        }

        $payload = [
            'resourceSpans' => [[
                'resource' => [
                    'attributes' => $this->attributes($this->resourceAttributes),
                ],
                'scopeSpans' => [[
                    'scope' => ['name' => 'php-storefront', 'version' => '0.0.1'],
                    'spans' => [$span],
                ]],
            ]],
        ];

        $this->post('/v1/traces', $payload);
    }

    public function exportMetrics(array $metrics): void
    {
        if (!$this->enabled) {
            return;
        }

        $payload = [
            'resourceMetrics' => [[
                'resource' => [
                    'attributes' => $this->attributes($this->resourceAttributes),
                ],
                'scopeMetrics' => [[
                    'scope' => ['name' => 'php-storefront', 'version' => '0.0.1'],
                    'metrics' => $metrics,
                ]],
            ]],
        ];

        $this->post('/v1/metrics', $payload);
    }

    public function startSpan(string $name, array $attributes = [], ?array $parentSpan = null, int $kind = 1): array
    {
        if (!$this->enabled) {
            return [
                'name' => $name,
                'traceId' => '',
                'spanId' => '',
                'kind' => $kind,
                'startTimeUnixNano' => $this->nowNano(),
                'attributes' => $this->attributes($attributes),
            ];
        }

        $span = [
            'name' => $name,
            'traceId' => $parentSpan['traceId'] ?? bin2hex(random_bytes(16)),
            'spanId' => bin2hex(random_bytes(8)),
            'kind' => $kind,
            'startTimeUnixNano' => $this->nowNano(),
            'attributes' => $this->attributes($attributes),
        ];

        if (isset($parentSpan['spanId'])) {
            $span['parentSpanId'] = (string) $parentSpan['spanId'];
        }

        return $span;
    }

    public function traceparentForSpan(array $span): string
    {
        $traceId = (string) ($span['traceId'] ?? '');
        $spanId = (string) ($span['spanId'] ?? '');

        if ($traceId === '' || $spanId === '') {
            return '';
        }

        return sprintf('00-%s-%s-01', $traceId, $spanId);
    }

    public function finishSpan(array $span, array $attributes = [], bool $error = false, string $message = ''): array
    {
        $status = ['code' => $error ? 2 : 1];
        if ($message !== '') {
            $status['message'] = $message;
        }

        $span['endTimeUnixNano'] = $this->nowNano();
        $span['attributes'] = array_merge($span['attributes'], $this->attributes($attributes));
        $span['status'] = $status;

        return $span;
    }

    public function counter(string $name, int|float $value, array $attributes = []): array
    {
        return [
            'name' => $name,
            'sum' => [
                'aggregationTemporality' => 2,
                'isMonotonic' => true,
                'dataPoints' => [[
                    'asDouble' => (float) $value,
                    'timeUnixNano' => $this->nowNano(),
                    'attributes' => $this->attributes($attributes),
                ]],
            ],
        ];
    }

    public function histogram(string $name, int|float $value, array $attributes = [], string $unit = 'ms', array $bounds = [50.0, 100.0, 250.0]): array
    {
        $value = (float) $value;
        $bounds = array_values(array_map(static fn (int|float $bound): float => (float) $bound, $bounds));
        sort($bounds);

        $bucketCounts = array_fill(0, count($bounds) + 1, '0');
        $bucketIndex = count($bounds);
        foreach ($bounds as $index => $bound) {
            if ($value <= $bound) {
                $bucketIndex = $index;
                break;
            }
        }
        $bucketCounts[$bucketIndex] = '1';

        return [
            'name' => $name,
            'unit' => $unit,
            'histogram' => [
                'aggregationTemporality' => 2,
                'dataPoints' => [[
                    'count' => '1',
                    'sum' => $value,
                    'min' => $value,
                    'max' => $value,
                    'bucketCounts' => $bucketCounts,
                    'explicitBounds' => $bounds,
                    'timeUnixNano' => $this->nowNano(),
                    'attributes' => $this->attributes($attributes),
                ]],
            ],
        ];
    }

    private function attributes(array $attributes): array
    {
        $result = [];
        foreach ($attributes as $key => $value) {
            $typedValue = match (true) {
                is_int($value) => ['intValue' => (string) $value],
                is_float($value) => ['doubleValue' => $value],
                is_bool($value) => ['boolValue' => $value],
                default => ['stringValue' => (string) $value],
            };

            $result[] = [
                'key' => (string) $key,
                'value' => $typedValue,
            ];
        }

        return $result;
    }

    private function post(string $path, array $payload): void
    {
        $url = rtrim($this->baseUrl, '/') . $path;
        $body = json_encode($payload, JSON_UNESCAPED_SLASHES);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_TIMEOUT => 2,
        ]);
        curl_exec($ch);
        curl_close($ch);
    }

    private function nowNano(): string
    {
        return (string) ((int) (microtime(true) * 1_000_000_000));
    }
}
