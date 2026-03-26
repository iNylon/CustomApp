<?php

declare(strict_types=1);

final class OtlpHttpEmitter
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly array $resourceAttributes,
    ) {
    }

    public function exportTrace(array $span): void
    {
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

    public function startSpan(string $name, array $attributes = []): array
    {
        return [
            'name' => $name,
            'traceId' => bin2hex(random_bytes(16)),
            'spanId' => bin2hex(random_bytes(8)),
            'startTimeUnixNano' => $this->nowNano(),
            'attributes' => $this->attributes($attributes),
        ];
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

    public function histogram(string $name, int|float $value, array $attributes = []): array
    {
        $value = (float) $value;

        return [
            'name' => $name,
            'unit' => 'ms',
            'histogram' => [
                'aggregationTemporality' => 2,
                'dataPoints' => [[
                    'count' => '1',
                    'sum' => $value,
                    'bucketCounts' => ['0', '0', '0', '1'],
                    'explicitBounds' => [50.0, 100.0, 250.0],
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
