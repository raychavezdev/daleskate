<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

const DALESKATE_JWT_LIFETIME_SECONDS = 28800;

function getAuthorizationHeader(): ?string
{
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    if (!is_array($headers)) {
        $headers = [];
    }

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

        if (!isset($decoded->iat, $decoded->exp)
            || !is_int($decoded->iat)
            || !is_int($decoded->exp)
            || $decoded->iat > time()
            || $decoded->exp <= $decoded->iat
            || $decoded->exp - $decoded->iat > DALESKATE_JWT_LIFETIME_SECONDS
            || $decoded->exp <= time()) {
            return null;
        }

        return isset($decoded->data) && isset($decoded->data->id)
            ? $decoded->data
            : null;
    } catch (Throwable $e) {
        return null;
    }
}

function authorizeAdminClaims(PDO $conn, ?object $claims): array
{
    if ($claims === null) {
        return [401, null];
    }

    if (!isset($claims->id) || !isset($claims->role) || $claims->role !== 'admin') {
        return [403, null];
    }

    try {
        $stmt = $conn->prepare("SELECT role FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([":id" => $claims->id]);
        $currentRole = $stmt->fetchColumn();
    } catch (Throwable $e) {
        return [500, null];
    }

    if ($currentRole !== 'admin') {
        return [403, null];
    }

    return [200, $claims];
}

function authorizeAdminRequest(PDO $conn, ?string $authorizationHeader, string $secretKey): array
{
    $claims = validateBearerToken($authorizationHeader, $secretKey);

    return authorizeAdminClaims($conn, $claims);
}

function requireAdmin(PDO $conn, string $secretKey): object
{
    [$statusCode, $claims] = authorizeAdminRequest(
        $conn,
        getAuthorizationHeader(),
        $secretKey
    );

    if ($statusCode !== 200) {
        http_response_code($statusCode);
        $error = $statusCode === 401
            ? "Token no proporcionado o inválido"
            : ($statusCode === 403 ? "Permisos insuficientes" : "Error interno del servidor");
        echo json_encode(["error" => $error]);
        exit;
    }

    return $claims;
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

        $issuedAt = time();
        $payload = [
            "iat" => $issuedAt,
            "exp" => $issuedAt + DALESKATE_JWT_LIFETIME_SECONDS,
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
