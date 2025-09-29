<?php
// Cargar variables de entorno
require_once __DIR__ . "/db.php";

// URL del frontend desde .env
$frontendUrl = $_ENV['FRONTEND_URL'] ?? "http://localhost:5173";

// ====== CORS y headers ======
header("Access-Control-Allow-Origin: $frontendUrl");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// ====== Preflight ======
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}