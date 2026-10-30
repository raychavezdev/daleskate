<?php
require_once __DIR__ . "/../config/headers.php";
require_once __DIR__ . "/../config/authentication.php";

$claims = validateBearerToken(getAuthorizationHeader(), requireSecretKey());

if ($claims === null) {
    http_response_code(401);
    echo json_encode(["error" => "Token no proporcionado o inválido"]);
    exit;
}

echo json_encode([
    "message" => "Token válido",
    "user" => $claims,
]);
