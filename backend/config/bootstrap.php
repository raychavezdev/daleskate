<?php
// Cargar autoload de Composer
require_once __DIR__ . '/../vendor/autoload.php';

// Inicializar dotenv
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad(); // safeLoad evita error si falta .env

// Opcional: definir valores por defecto si no están en .env
$_ENV['APP_ENV'] = $_ENV['APP_ENV'] ?? 'production';
$_ENV['UPLOADS_DIR'] = $_ENV['UPLOADS_DIR'] ?? 'uploads';

// Configurar errores según el entorno
if ($_ENV['APP_ENV'] === 'development') {
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    error_reporting(0);
}