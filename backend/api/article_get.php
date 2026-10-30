<?php
require_once __DIR__ . "/../config/headers.php";
require_once __DIR__ . "/../config/authentication.php";
require_once __DIR__ . "/../config/article_access.php";

$id = $_GET['id'] ?? null;
$token = $_GET['token'] ?? null;

if (!$id && !$token) {
    http_response_code(400);
    echo json_encode(["error" => "Faltan parámetros"]);
    exit;
}

try {
    if ($token) {
        $article = getExclusiveArticleByShareToken($conn, $token);

        if (!$article) {
            http_response_code(403);
            echo json_encode(["error" => "No autorizado"]);
            exit;
        }

        echo json_encode($article);
        exit;
    }

    $article = getArticleById($conn, $id);

    if ($article === null) {
        $claims = requireAdmin($conn, requireSecretKey());
        $article = getArticleById($conn, $id, true);
    }

    if (!$article) {
        http_response_code(404);
        echo json_encode(["error" => "Artículo no encontrado"]);
        exit;
    }

    echo json_encode($article);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al obtener artículo"]);
}
