<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

function getAuthorizationHeader(): ?string
{
    $headers = function_exists('getallheaders') ? getallheaders() : [];

    foreach ($headers as $name => $value) {
        if (strcasecmp($name, 'Authorization') === 0 && is_string($value)) {
            return $value;
        }
    }

    $serverHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;

    return is_string($serverHeader) ? $serverHeader : null;
}

function validateBearerToken(?string $authorizationHeader, string $secretKey): ?object
{
    if (!is_string($authorizationHeader) || !preg_match('/\ABearer\s+(\S+)\z/i', trim($authorizationHeader), $matches)) {
        return null;
    }

    try {
        $decoded = JWT::decode($matches[1], new Key($secretKey, 'HS256'));

        return isset($decoded->data) && isset($decoded->data->id)
            ? $decoded->data
            : null;
    } catch (Throwable $e) {
        return null;
    }
}

function authenticateRequest(PDO $conn, $data, string $secretKey): array
{
    try {
        $username = is_object($data) && isset($data->username) && is_string($data->username)
            ? $data->username
            : '';
        $password = is_object($data) && isset($data->password) && is_string($data->password)
            ? $data->password
            : '';

        if ($username === '' || $password === '') {
            return [401, ["error" => "Credenciales inválidas"]];
        }

        $stmt = $conn->prepare(
            "SELECT id, username, role, password FROM users WHERE username = :username LIMIT 1"
        );
        $stmt->execute([":username" => $username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($password, $user["password"] ?? '')) {
            return [401, ["error" => "Credenciales inválidas"]];
        }

        $payload = [
            "iat" => time(),
            "data" => [
                "id" => $user["id"],
                "username" => $user["username"],
                "role" => $user["role"],
            ],
        ];

        return [200, [
            "message" => "Login exitoso",
            "token" => JWT::encode($payload, $secretKey, "HS256"),
        ]];
    } catch (Throwable $e) {
        return [500, ["error" => "Error interno de autenticación"]];
    }
}
