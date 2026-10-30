<?php
require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad(); // safeLoad evita error si falta .env

$_ENV['APP_ENV'] = $_ENV['APP_ENV'] ?? 'production';
$_ENV['UPLOADS_DIR'] = $_ENV['UPLOADS_DIR'] ?? 'uploads';

function getSecretKey(): ?string
{
    $secretKey = $_ENV['SECRET_KEY'] ?? null;

    return is_string($secretKey) && trim($secretKey) !== ''
        ? $secretKey
        : null;
}

function requireSecretKey(): string
{
    $secretKey = getSecretKey();

    if ($secretKey === null) {
        http_response_code(500);
        echo json_encode(['error' => 'Error interno del servidor']);
        exit;
    }

    return $secretKey;
}

if ($_ENV['APP_ENV'] === 'development') {
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    error_reporting(0);
}
