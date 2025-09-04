<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "../vendor/autoload.php";

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

$secret_key = "TU_SECRET_KEY_AQUI";

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
