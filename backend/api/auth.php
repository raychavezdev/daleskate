<?php
// ✅ Cargar CORS + conexión DB
require_once __DIR__ . "/../config/headers.php";
require_once __DIR__ . "/../vendor/autoload.php"; // JWT
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// ====== 1️⃣ Leer datos del body ======
$data = json_decode(file_get_contents("php://input"));
$username = $data->username ?? null;
$password = $data->password ?? null;

if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(["error" => "Usuario y contraseña requeridos"]);
    exit;
}

// ====== 2️⃣ Buscar usuario en DB ======
$stmt = $conn->prepare("SELECT * FROM users WHERE username = :username LIMIT 1");
$stmt->bindParam(":username", $username);
$stmt->execute();
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(["error" => "Credenciales inválidas"]);
    exit;
}

// ====== 3️⃣ Crear JWT ======
$secret_key = $_ENV["SECRET_KEY"]; // Desde .env

$payload = [
    "iat" => time(),
    "data" => [
        "id" => $user["id"],
        "username" => $user["username"],
        "role" => $user["role"]
    ]
];

$jwt = JWT::encode($payload, $secret_key, "HS256");

// ====== 4️⃣ Responder ======
echo json_encode([
    "message" => "Login exitoso",
    "token" => $jwt
]);