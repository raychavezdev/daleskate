<?php

require_once __DIR__ . "/../vendor/autoload.php";
require_once __DIR__ . "/../config/bootstrap.php";
require_once __DIR__ . "/../config/authentication.php";

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

function assertTest(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FALLO: $message\n");
        exit(1);
    }
}

$db = new PDO("sqlite::memory:");
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->exec("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, role TEXT, password TEXT)");

$testPassword = "DaleSkate-Test-Password-Only";
$testSecret = "test-only-jwt-secret-not-for-production";
$_ENV["SECRET_KEY"] = $testSecret;
assertTest(getSecretKey() === $testSecret, "la clave ficticia configurada debe estar disponible");
$testSecret = requireSecretKey();
$testHash = password_hash($testPassword, PASSWORD_BCRYPT);
$insert = $db->prepare("INSERT INTO users (id, username, role, password) VALUES (?, ?, ?, ?)");
$insert->execute([1, "test-user", "admin", $testHash]);

[$status, $response] = authenticateRequest($db, (object)[
    "username" => "test-user",
    "password" => $testPassword,
], $testSecret);
assertTest($status === 200 && isset($response["token"]), "credenciales correctas deben emitir un token");
$decoded = JWT::decode($response["token"], new Key($testSecret, "HS256"));
assertTest($decoded->data->username === "test-user", "el token de prueba debe ser válido");
assertTest($decoded->iat > 0 && $decoded->exp - $decoded->iat === DALESKATE_JWT_LIFETIME_SECONDS, "el JWT debe expirar exactamente ocho horas después de emitirse");
assertTest(validateBearerToken("Bearer " . $response["token"], $testSecret) !== null, "el validador debe aceptar un JWT vigente");

$expiredToken = JWT::encode([
    "iat" => time() - DALESKATE_JWT_LIFETIME_SECONDS - 1,
    "exp" => time() - 1,
    "data" => ["id" => 1, "username" => "test-user", "role" => "admin"],
], $testSecret, "HS256");
assertTest(validateBearerToken("Bearer " . $expiredToken, $testSecret) === null, "el validador debe rechazar JWT expirados");

$legacyToken = JWT::encode([
    "iat" => time(),
    "data" => ["id" => 1, "username" => "test-user", "role" => "admin"],
], $testSecret, "HS256");
assertTest(validateBearerToken("Bearer " . $legacyToken, $testSecret) === null, "el validador debe rechazar JWT antiguos sin exp");

$tokenParts = explode('.', $response["token"]);
$tokenParts[2] = ($tokenParts[2][0] === 'A' ? 'B' : 'A') . substr($tokenParts[2], 1);
assertTest(validateBearerToken("Bearer " . implode('.', $tokenParts), $testSecret) === null, "el validador debe rechazar firmas alteradas");

unset($_ENV["SECRET_KEY"]);
assertTest(getSecretKey() === null, "la clave ausente debe detectarse sin usar un valor predeterminado");
$_ENV["SECRET_KEY"] = "  ";
assertTest(getSecretKey() === null, "una clave vacía debe detectarse sin usar un valor predeterminado");
$_ENV["SECRET_KEY"] = $testSecret;

$invalidCases = [
    [(object)["username" => "test-user", "password" => "incorrecta"], "contraseña incorrecta"],
    [(object)["username" => "usuario-inexistente", "password" => "cualquiera"], "usuario inexistente"],
    [(object)["username" => "", "password" => "cualquiera"], "usuario vacío"],
    [(object)["username" => "test-user", "password" => ""], "contraseña vacía"],
    [null, "cuerpo vacío o inválido"],
];

foreach ($invalidCases as [$request, $case]) {
    [$status, $response] = authenticateRequest($db, $request, $testSecret);
    assertTest($status === 401, "$case debe ser rechazado");
    assertTest(!isset($response["token"]), "$case no debe emitir JWT");
    assertTest($response["error"] === "Credenciales inválidas", "$case debe usar error genérico");
}

$brokenDb = new PDO("sqlite::memory:");
[$status, $response] = authenticateRequest($brokenDb, (object)[
    "username" => "test-user",
    "password" => $testPassword,
], $testSecret);
assertTest($status === 500, "un error interno debe responder con estado 500");
assertTest($response === ["error" => "Error interno de autenticación"], "un error interno no debe filtrar detalles ni emitir JWT");

fwrite(STDOUT, "OK: autenticación correcta, rechazos y error interno verificados.\n");
