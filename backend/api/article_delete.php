<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// Responder a preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once("../config/db.php");
require_once("../vendor/autoload.php");

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Validar token
$headers = getallheaders();
if (!isset($headers['Authorization'])) {
    http_response_code(401);
    echo json_encode(["error" => "Token no proporcionado"]);
    exit;
}
$authHeader = $headers['Authorization'];
$parts = explode(" ", $authHeader);
$type = $parts[0] ?? '';
$token = $parts[1] ?? '';
$secret_key = "TU_SECRET_KEY_AQUI";
try {
    $decoded = JWT::decode($token, new Key($secret_key, 'HS256'));
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["error" => "Token inválido"]);
    exit;
}

// Obtener ID
$id = $_GET['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(["error" => "ID faltante"]);
    exit;
}

// Eliminar artículo
$stmt = $conn->prepare("DELETE FROM articles WHERE id=:id");
$stmt->bindParam(":id", $id);
try {
    $stmt->execute();
    echo json_encode(["message" => "Artículo eliminado"]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al eliminar artículo", "detail" => $e->getMessage()]);
}
