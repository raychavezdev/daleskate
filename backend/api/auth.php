<?php
// Mostrar errores mientras depuras
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// Preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "../config/db.php";
require_once "../vendor/autoload.php"; // JWT
use Firebase\JWT\JWT;

// Leer datos del body
$data = json_decode(file_get_contents("php://input"));
$username = $data->username ?? null;
$password = $data->password ?? null;

if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(["error" => "Usuario y contraseña requeridos"]);
    exit;
}

// Buscar usuario en DB
$stmt = $conn->prepare("SELECT * FROM users WHERE username = :username LIMIT 1");
$stmt->bindParam(":username", $username);
$stmt->execute();
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(["error" => "Credenciales inválidas"]);
    exit;
}

// Crear JWT
$secret_key = "TU_SECRET_KEY_AQUI";

$payload = [
    "iat" => time(),
    "data" => [
        "id" => $user["id"],
        "username" => $user["username"],
        "role" => $user["role"]
    ]
];


$jwt = JWT::encode($payload, $secret_key, "HS256");

// Respuesta limpia
echo json_encode([
    "message" => "Login exitoso",
    "token" => $jwt
]);
