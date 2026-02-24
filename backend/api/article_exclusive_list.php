<?php
require_once __DIR__ . "/../config/headers.php";

try {
    $stmt = $conn->prepare("
        SELECT id, title, slug, exclusive_token, created_at
        FROM articles
        WHERE is_exclusive = 1
        ORDER BY created_at DESC
    ");

    $stmt->execute();
    $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($articles);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al obtener artículos exclusivos"]);
}
