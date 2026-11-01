<?php
require_once __DIR__ . "/../config/headers.php";
require_once __DIR__ . "/../config/authentication.php";

$claims = requireAdmin($conn, requireSecretKey());

try {
    $stmt = $conn->prepare(
        "SELECT id, title, slug, tags, created_at, is_exclusive, status
         FROM articles
         ORDER BY created_at DESC"
    );
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al obtener artículos"]);
}
