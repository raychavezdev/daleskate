<?php

require_once __DIR__ . "/../config/headers.php";
require_once __DIR__ . "/../vendor/autoload.php";
require_once __DIR__ . "/../config/authentication.php";

use Firebase\JWT\JWT;
use Firebase\JWT\Key;


$claims = validateBearerToken(getAuthorizationHeader(), $_ENV["SECRET_KEY"]);
if ($claims === null) {
    http_response_code(401);
    echo json_encode(["error" => "Token no proporcionado o inválido"]);
    exit;
}
$user_id = $claims->id;

$input = json_decode(file_get_contents("php://input"), true);
$current_password = $input['current_password'] ?? null;
$new_password = $input['new_password'] ?? null;

if (!$current_password || !$new_password) {
    http_response_code(400);
    echo json_encode(["error" => "Faltan datos obligatorios"]);
    exit;
}


$stmt = $conn->prepare("SELECT password FROM users WHERE id = :id");
$stmt->bindParam(":id", $user_id, PDO::PARAM_INT);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(404);
    echo json_encode(["error" => "Usuario no encontrado"]);
    exit;
}


if (!password_verify($current_password, $user['password'])) {
    http_response_code(400);
    echo json_encode(["error" => "Contraseña actual incorrecta"]);
    exit;
}


$newPasswordHash = password_hash($new_password, PASSWORD_DEFAULT);


$stmt = $conn->prepare("UPDATE users SET password = :password WHERE id = :id");
$stmt->bindParam(":password", $newPasswordHash);
$stmt->bindParam(":id", $user_id, PDO::PARAM_INT);

try {
    $stmt->execute();
    echo json_encode(["message" => "Contraseña actualizada correctamente"]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al actualizar contraseña", "detail" => $e->getMessage()]);
}
