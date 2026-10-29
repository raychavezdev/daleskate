<?php

require_once __DIR__ . "/../vendor/autoload.php";
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
