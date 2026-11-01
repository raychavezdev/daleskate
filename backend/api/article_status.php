<?php
require_once __DIR__ . "/../config/headers.php";
require_once __DIR__ . "/../config/authentication.php";

$claims = requireAdmin($conn, requireSecretKey());
$id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
$status = $_POST['status'] ?? null;

if (!$id || $status !== 'draft') {
    http_response_code(400);
    echo json_encode(["error" => "Solicitud de estado inválida"]);
    exit;
}

try {
    $stmt = $conn->prepare("UPDATE articles SET status = 'draft' WHERE id = :id");
    $stmt->execute([':id' => $id]);
    if ($stmt->rowCount() === 0) {
        $exists = $conn->prepare("SELECT id FROM articles WHERE id = :id");
        $exists->execute([':id' => $id]);
        if (!$exists->fetchColumn()) {
            http_response_code(404);
            echo json_encode(["error" => "Artículo no encontrado"]);
            exit;
        }
    }
    echo json_encode(["message" => "Artículo guardado como borrador", "status" => "draft"]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "No se pudo actualizar el estado del artículo"]);
}
