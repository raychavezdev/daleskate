<?php

require_once __DIR__ . "/../vendor/autoload.php";
require_once __DIR__ . "/../config/authentication.php";

use Firebase\JWT\JWT;

function assertAdminAuthTest(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FALLO: $message\n");
        exit(1);
    }
}

$testSecret = "admin-endpoints-test-only-secret";
$validJwt = JWT::encode([
    "iat" => time(),
    "data" => ["id" => 7, "username" => "test-user", "role" => "test"],
], $testSecret, "HS256");

assertAdminAuthTest(validateBearerToken(null, $testSecret) === null, "solicitud sin JWT debe rechazarse");
assertAdminAuthTest(validateBearerToken("Bearer no-es-un-jwt", $testSecret) === null, "solicitud con JWT inválido debe rechazarse");
assertAdminAuthTest(validateBearerToken("Bearer " . $validJwt, $testSecret) !== null, "JWT válido debe permitir continuar");

$tamperedParts = explode('.', $validJwt);
$tamperedParts[2] = ($tamperedParts[2][0] === 'A' ? 'B' : 'A') . substr($tamperedParts[2], 1);
assertAdminAuthTest(
    validateBearerToken("Bearer " . implode('.', $tamperedParts), $testSecret) === null,
    "JWT alterado debe rechazarse"
);

$db = new PDO("sqlite::memory:");
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->exec("CREATE TABLE effects (id INTEGER PRIMARY KEY)");
$simulateAdminOperation = static function (?string $header) use ($db, $testSecret): int {
    $claims = validateBearerToken($header, $testSecret);
    if ($claims === null) {
        return 401;
    }

    $db->exec("INSERT INTO effects (id) VALUES (1)");
    return 200;
};

assertAdminAuthTest($simulateAdminOperation(null) === 401, "operación sin JWT debe devolver 401");
assertAdminAuthTest($simulateAdminOperation("Bearer inválido") === 401, "operación con JWT inválido debe devolver 401");
assertAdminAuthTest((int)$db->query("SELECT COUNT(*) FROM effects")->fetchColumn() === 0, "solicitudes rechazadas no deben cambiar la base de datos");
assertAdminAuthTest($simulateAdminOperation("Bearer " . $validJwt) === 200, "operación con JWT válido debe continuar");
assertAdminAuthTest((int)$db->query("SELECT COUNT(*) FROM effects")->fetchColumn() === 1, "la operación autorizada puede modificar la base de prueba");

$apiDir = __DIR__ . "/../api/";
$adminEndpoints = [
    "ads_create.php" => 'if (!file_exists($uploadDir))',
    "ads_delete.php" => "SELECT image FROM ads",
    "poll_create.php" => "INSERT INTO polls",
    "poll_delete.php" => "DELETE FROM polls",
    "poll_list.php" => "SELECT id, question, options, votes",
    "article_stats.php" => "SELECT",
];

foreach ($adminEndpoints as $file => $operationMarker) {
    $source = file_get_contents($apiDir . $file);
    $guardPosition = strpos($source, '$claims = validateBearerToken');
    $rejectPosition = $guardPosition === false ? false : strpos($source, 'if ($claims === null)', $guardPosition);
    $exitPosition = $rejectPosition === false ? false : strpos($source, 'exit;', $rejectPosition);
    $operationPosition = strpos($source, $operationMarker);

    assertAdminAuthTest($guardPosition !== false, "$file debe usar la validación JWT compartida");
    assertAdminAuthTest($rejectPosition !== false && $exitPosition !== false, "$file debe detener solicitudes no autorizadas");
    assertAdminAuthTest($operationPosition !== false && $exitPosition < $operationPosition, "$file debe validar antes de consultar o modificar datos/archivos");
    assertAdminAuthTest(strpos($source, 'http_response_code(401)', $rejectPosition) !== false, "$file debe responder 401 si falla autenticación");
}

$publicEndpoints = [
    "ads_get.php" => "SELECT * FROM ads",
    "poll_get_active.php" => "SELECT * FROM polls",
    "poll_vote.php" => "UPDATE polls SET votes",
    "article_list.php" => "WHERE is_exclusive = 0",
    "article_videos.php" => "WHERE is_exclusive = 0",
];

foreach ($publicEndpoints as $file => $publicMarker) {
    $source = file_get_contents($apiDir . $file);
    assertAdminAuthTest(strpos($source, 'validateBearerToken') === false, "$file debe seguir siendo público sin JWT");
    assertAdminAuthTest(strpos($source, $publicMarker) !== false, "$file debe conservar su operación pública");
}

$frontendDir = __DIR__ . "/../../frontend/src/components/admin/";
foreach (["AdsAdmin.jsx", "PollCreate.jsx", "PollList.jsx", "ArticleStats.jsx"] as $file) {
    $source = file_get_contents($frontendDir . $file);
    assertAdminAuthTest(strpos($source, "Authorization") !== false, "$file debe enviar Authorization en llamadas protegidas");
    assertAdminAuthTest(strpos($source, 'localStorage.getItem("token")') !== false, "$file debe reutilizar el token almacenado");
    assertAdminAuthTest(strpos($source, 'res.status === 401') !== false, "$file debe manejar respuestas 401");
}

$adsAdminSource = file_get_contents($frontendDir . "AdsAdmin.jsx");
$publicAdsFetch = substr($adsAdminSource, strpos($adsAdminSource, "const fetchAds"), strpos($adsAdminSource, "useEffect(() =>") - strpos($adsAdminSource, "const fetchAds"));
assertAdminAuthTest(strpos($publicAdsFetch, "Authorization") === false, "la lectura pública de anuncios no debe enviar JWT innecesariamente");

fwrite(STDOUT, "OK: guards administrativos, rechazos sin efectos, endpoints públicos y llamadas React verificados.\n");
