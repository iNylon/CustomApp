<?php

declare(strict_types=1);

final class AppLogger
{
    public function __construct(
        private readonly string $serviceName,
        private readonly string $logFile,
    ) {
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
        $entry = [
            'timestamp' => gmdate('Y-m-d\TH:i:s.v\Z'),
            'severity' => $severity,
            'service.name' => $this->serviceName,
            'message' => $message,
            'context' => $context,
        ];

        $line = json_encode($entry, JSON_UNESCAPED_SLASHES) . PHP_EOL;
        @file_put_contents($this->logFile, $line, FILE_APPEND);
        file_put_contents('php://stderr', $line, FILE_APPEND);
    }
}
