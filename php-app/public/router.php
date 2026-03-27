<?php

declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$fullPath = $path ? __DIR__ . $path : __DIR__;

if ($path !== '/' && $path !== false && is_file($fullPath)) {
    return false;
}

require __DIR__ . '/index.php';
