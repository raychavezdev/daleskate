<?php

require_once __DIR__ . "/../config/headers.php";
require_once __DIR__ . "/../vendor/autoload.php";
require_once __DIR__ . "/../config/authentication.php";

$data = json_decode(file_get_contents("php://input"));

try {
    [$statusCode, $response] = authenticateRequest($conn, $data, $_ENV["SECRET_KEY"]);
    http_response_code($statusCode);
    echo json_encode($response);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error interno de autenticación"]);
}
