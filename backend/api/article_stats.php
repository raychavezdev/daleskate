<?php

require_once __DIR__ . "/../config/headers.php";

try {

    $stmt = $conn->prepare("
        SELECT
            a.id,
            a.title,
            COUNT(av.id) AS views
        FROM articles a
        LEFT JOIN article_views av
            ON av.article_id = a.id
        GROUP BY a.id
        ORDER BY views DESC
    ");

    $stmt->execute();

    echo json_encode(
        $stmt->fetchAll(PDO::FETCH_ASSOC)
    );
} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "error" => "Error obteniendo estadísticas",
        "detail" => $e->getMessage()
    ]);
}
