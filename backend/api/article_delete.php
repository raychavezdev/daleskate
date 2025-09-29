<?php
// ✅ Cargar CORS + conexión a DB
require_once __DIR__ . "/../config/headers.php";
require_once __DIR__ . "/../vendor/autoload.php";

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// ====== 1️⃣ Validar token ======
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

if ($type !== "Bearer" || !$token) {
    http_response_code(401);
    echo json_encode(["error" => "Token inválido"]);
    exit;
}

// ✅ Usamos la SECRET_KEY desde .env
$secret_key = $_ENV["SECRET_KEY"];

try {
    $decoded = JWT::decode($token, new Key($secret_key, 'HS256'));
    $user_id = $decoded->data->id;
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["error" => "Token inválido", "detail" => $e->getMessage()]);
    exit;
}

// ====== 2️⃣ Obtener ID del artículo ======
$id = $_GET['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(["error" => "ID faltante"]);
    exit;
}

// ====== 3️⃣ Eliminar artículo ======
$stmt = $conn->prepare("DELETE FROM articles WHERE id=:id");
$stmt->bindParam(":id", $id);

try {
    $stmt->execute();
    echo json_encode(["message" => "Artículo eliminado correctamente"]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al eliminar artículo", "detail" => $e->getMessage()]);
}