<?php
// ✅ Cargar CORS + conexión DB (aunque no use DB, headers.php maneja CORS)
require_once __DIR__ . "/../config/headers.php";
require_once __DIR__ . "/../vendor/autoload.php";

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// ====== 1️⃣ Obtener token ======
$headers = getallheaders();
if (!isset($headers['Authorization'])) {
    http_response_code(401);
    echo json_encode(["error" => "Token no proporcionado"]);
    exit;
}

$authHeader = $headers['Authorization'];
list($type, $token) = explode(" ", $authHeader);

if ($type !== "Bearer" || !$token) {
    http_response_code(401);
    echo json_encode(["error" => "Token inválido"]);
    exit;
}

// ====== 2️⃣ Validar JWT ======
$secret_key = $_ENV["SECRET_KEY"]; // Desde .env

try {
    $decoded = JWT::decode($token, new Key($secret_key, 'HS256'));
    echo json_encode([
        "message" => "Token válido",
        "user" => $decoded->data
    ]);
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["error" => "Token inválido", "detail" => $e->getMessage()]);
}