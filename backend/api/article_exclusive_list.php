<?php
require_once __DIR__ . "/../config/headers.php";
require_once __DIR__ . "/../config/authentication.php";
require_once __DIR__ . "/../config/article_access.php";

$claims = validateBearerToken(getAuthorizationHeader(), $_ENV["SECRET_KEY"]);

try {
    $articles = getExclusiveArticles($conn, $claims);

    if ($articles === null) {
        http_response_code(401);
        echo json_encode(["error" => "Token no proporcionado o inválido"]);
        exit;
    }

    echo json_encode($articles);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al obtener artículos exclusivos"]);
}
