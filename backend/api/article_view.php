<?php

require_once __DIR__ . "/../config/headers.php";

try {

    $articleId = $_POST['article_id'] ?? null;

    if (!$articleId) {
        http_response_code(400);
        echo json_encode([
            "error" => "ID de artículo requerido"
        ]);
        exit;
    }

    $stmt = $conn->prepare("
        INSERT INTO article_views (article_id)
        SELECT id FROM articles WHERE id = :article_id AND status = 'published'
    ");

    $stmt->bindParam(":article_id", $articleId);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(["error" => "Artículo no encontrado"]);
        exit;
    }

    echo json_encode([
        "success" => true
    ]);
} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "error" => "Error al registrar visita",
        "detail" => $e->getMessage()
    ]);
}
