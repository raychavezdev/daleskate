<?php

use Firebase\JWT\JWT;

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
