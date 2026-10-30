<?php
require_once __DIR__ . "/../config/headers.php";
require_once __DIR__ . "/../vendor/autoload.php";

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
require_once __DIR__ . "/../config/authentication.php";

$claims = requireAdmin($conn, $_ENV["SECRET_KEY"]);
$id = $_GET['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(["error" => "ID faltante"]);
    exit;
}

$stmt = $conn->prepare("DELETE FROM articles WHERE id=:id");
$stmt->bindParam(":id", $id);

try {
    $stmt->execute();
    echo json_encode(["message" => "Artículo eliminado correctamente"]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al eliminar artículo", "detail" => $e->getMessage()]);
}
