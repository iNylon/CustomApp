<?php

declare(strict_types=1);

final class AppLogger
{
    private array $traceContext = [];
    private string $requestId = '';

    public function __construct(
        private readonly string $serviceName,
        private readonly string $logFile,
        private readonly array $defaultContext = [],
    ) {
    }

    public function setTraceContext(string $traceId, string $spanId): void
    {
        $this->traceContext = [
            'trace_id' => $traceId,
            'span_id' => $spanId,
        ];
    }

    public function setRequestId(string $requestId): void
    {
        $this->requestId = $requestId;
    }

    public function info(string $message, array $context = []): void
    {
        $this->write('INFO', $message, $context);
    }

    public function error(string $message, array $context = []): void
    {
        $this->write('ERROR', $message, $context);
    }

    public function warn(string $message, array $context = []): void
    {
        $this->write('WARN', $message, $context);
    }

    public function write(string $severity, string $message, array $context = []): void
    {
        $context = array_merge($this->defaultContext, $context);
        $traceId = (string) ($context['trace_id'] ?? $this->traceContext['trace_id'] ?? '');
        $spanId = (string) ($context['span_id'] ?? $this->traceContext['span_id'] ?? '');
        $requestId = (string) ($context['request_id'] ?? $this->requestId);

        if ($traceId !== '' && !isset($context['trace_id'])) {
            $context['trace_id'] = $traceId;
        }
        if ($spanId !== '' && !isset($context['span_id'])) {
            $context['span_id'] = $spanId;
        }
        if ($requestId !== '' && !isset($context['request_id'])) {
            $context['request_id'] = $requestId;
        }

        $entry = [
            'timestamp' => gmdate('Y-m-d\TH:i:s.v\Z'),
            'severity' => $severity,
            'service.name' => $this->serviceName,
            'message' => $message,
            'context' => $context,
        ];

        foreach ($this->defaultContext as $key => $value) {
            $entry[(string) $key] = $value;
        }

        $entry['trace_id'] = $traceId;
        $entry['span_id'] = $spanId;
        $entry['request_id'] = $requestId;

        $line = json_encode($entry, JSON_UNESCAPED_SLASHES) . PHP_EOL;
        @file_put_contents($this->logFile, $line, FILE_APPEND);
        file_put_contents('php://stderr', $line, FILE_APPEND);
    }
}
