<?php

require_once __DIR__ . "/../config/headers.php";
require_once __DIR__ . "/../vendor/autoload.php"; 
use Firebase\JWT\JWT;
use Firebase\JWT\Key;


$data = json_decode(file_get_contents("php://input"));
$username = $data->username ?? null;
$password = $data->password ?? null;

if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(["error" => "Usuario y contraseña requeridos"]);
    exit;
}


$stmt = $conn->prepare("SELECT * FROM users WHERE username = :username LIMIT 1");
$stmt->bindParam(":username", $username);
$stmt->execute();
$user = $stmt->fetch();








$secret_key = $_ENV["SECRET_KEY"]; 

$payload = [
    "iat" => time(),
    "data" => [
        "id" => $user["id"],
        "username" => $user["username"],
        "role" => $user["role"]
    ]
];

$jwt = JWT::encode($payload, $secret_key, "HS256");


echo json_encode([
    "message" => "Login exitoso",
    "token" => $jwt
]);
