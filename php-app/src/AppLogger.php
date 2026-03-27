<?php

declare(strict_types=1);

final class AppLogger
{
    private array $traceContext = [];

    public function __construct(
        private readonly string $serviceName,
        private readonly string $logFile,
    ) {
    }

    public function setTraceContext(string $traceId, string $spanId): void
    {
        $this->traceContext = [
            'trace_id' => $traceId,
            'span_id' => $spanId,
        ];
    }

    public function info(string $message, array $context = []): void
    {
        $this->write('INFO', $message, $context);
    }

    public function error(string $message, array $context = []): void
    {
        $this->write('ERROR', $message, $context);
    }

    public function write(string $severity, string $message, array $context = []): void
    {
        $traceId = (string) ($context['trace_id'] ?? $this->traceContext['trace_id'] ?? '');
        $spanId = (string) ($context['span_id'] ?? $this->traceContext['span_id'] ?? '');

        if ($traceId !== '' && !isset($context['trace_id'])) {
            $context['trace_id'] = $traceId;
        }
        if ($spanId !== '' && !isset($context['span_id'])) {
            $context['span_id'] = $spanId;
        }

        $entry = [
            'timestamp' => gmdate('Y-m-d\TH:i:s.v\Z'),
            'severity' => $severity,
            'service.name' => $this->serviceName,
            'message' => $message,
            'context' => $context,
        ];

        $entry['trace_id'] = $traceId;
        $entry['span_id'] = $spanId;

        $line = json_encode($entry, JSON_UNESCAPED_SLASHES) . PHP_EOL;
        @file_put_contents($this->logFile, $line, FILE_APPEND);
        file_put_contents('php://stderr', $line, FILE_APPEND);
    }
}
