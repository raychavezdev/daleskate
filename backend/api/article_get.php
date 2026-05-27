<?php
require_once __DIR__ . "/../config/headers.php";

try {

    $id = $_GET['id'] ?? null;
    $token = $_GET['token'] ?? null;

    if (!$id && !$token) {
        http_response_code(400);
        echo json_encode(["error" => "Faltan parámetros"]);
        exit;
    }

    
    if ($token) {

        $stmt = $conn->prepare("
            SELECT * FROM articles 
            WHERE exclusive_token = :token AND is_exclusive = 1
        ");
        $stmt->bindParam(":token", $token);
        $stmt->execute();

        $article = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$article) {
            http_response_code(403);
            echo json_encode(["error" => "No autorizado"]);
            exit;
        }

        echo json_encode($article);
        exit;
    }

    
    
    if ($id) {
        $stmt = $conn->prepare("
        SELECT * FROM articles 
        WHERE id = :id
    ");
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        $article = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$article) {
            http_response_code(404);
            echo json_encode(["error" => "Artículo no encontrado"]);
            exit;
        }

        echo json_encode($article);
        exit;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Error al obtener artículo",
        "detail" => $e->getMessage()
    ]);
}
