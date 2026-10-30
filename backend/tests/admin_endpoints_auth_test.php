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

function makeAdminAuthTestToken(int $id, ?string $role, string $secret): string
{
    $data = ["id" => $id, "username" => "test-user"];
    if ($role !== null) {
        $data["role"] = $role;
    }

    return JWT::encode(["iat" => time(), "data" => $data], $secret, "HS256");
}

$testSecret = "admin-endpoints-test-only-secret";
$adminJwt = makeAdminAuthTestToken(1, "admin", $testSecret);
$editorJwt = makeAdminAuthTestToken(2, "editor", $testSecret);
$missingRoleJwt = makeAdminAuthTestToken(1, null, $testSecret);

$parts = explode('.', $adminJwt);
$payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
$payload["data"]["role"] = "editor";
$parts[1] = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');
$alteredRoleJwt = implode('.', $parts);

$db = new PDO("sqlite::memory:");
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->exec("CREATE TABLE users (id INTEGER PRIMARY KEY, role TEXT)");
$db->exec("INSERT INTO users (id, role) VALUES (1, 'admin'), (2, 'editor')");
$db->exec("CREATE TABLE effects (id INTEGER PRIMARY KEY AUTOINCREMENT)");

[$status] = authorizeAdminRequest($db, null, $testSecret);
assertAdminAuthTest($status === 401, "JWT ausente debe responder 401");
[$status] = authorizeAdminRequest($db, "Bearer inválido", $testSecret);
assertAdminAuthTest($status === 401, "JWT inválido debe responder 401");
[$status] = authorizeAdminRequest($db, "Bearer " . $alteredRoleJwt, $testSecret);
assertAdminAuthTest($status === 401, "alterar el rol dentro del JWT debe invalidar la firma y responder 401");

[$status, $adminClaims] = authorizeAdminRequest($db, "Bearer " . $adminJwt, $testSecret);
assertAdminAuthTest($status === 200 && $adminClaims->role === "admin", "JWT admin con rol actual admin debe autorizarse");
[$status] = authorizeAdminRequest($db, "Bearer " . $editorJwt, $testSecret);
assertAdminAuthTest($status === 403, "JWT válido con otro rol debe responder 403");
[$status] = authorizeAdminRequest($db, "Bearer " . $missingRoleJwt, $testSecret);
assertAdminAuthTest($status === 403, "JWT válido sin claim role debe responder 403");

$oldAdminClaim = makeAdminAuthTestToken(2, "admin", $testSecret);
[$status] = authorizeAdminRequest($db, "Bearer " . $oldAdminClaim, $testSecret);
assertAdminAuthTest($status === 403, "claim admin antiguo debe rechazarse si la base ya tiene otro rol");

$simulateAdminOperation = static function (?string $header) use ($db, $testSecret): int {
    [$status] = authorizeAdminRequest($db, $header, $testSecret);
    if ($status !== 200) {
        return $status;
    }

    $db->exec("INSERT INTO effects DEFAULT VALUES");
    return 200;
};

assertAdminAuthTest($simulateAdminOperation(null) === 401, "operación sin JWT debe rechazarse");
assertAdminAuthTest($simulateAdminOperation("Bearer " . $editorJwt) === 403, "operación con rol no admin debe rechazarse");
assertAdminAuthTest((int)$db->query("SELECT COUNT(*) FROM effects")->fetchColumn() === 0, "operaciones rechazadas no deben producir efectos secundarios");
assertAdminAuthTest($simulateAdminOperation("Bearer " . $adminJwt) === 200, "operación con JWT admin válido debe continuar");
assertAdminAuthTest((int)$db->query("SELECT COUNT(*) FROM effects")->fetchColumn() === 1, "la operación autorizada debe continuar en la base de prueba");

$db->exec("UPDATE users SET role = 'editor' WHERE id = 1");
[$status] = authorizeAdminRequest($db, "Bearer " . $adminJwt, $testSecret);
assertAdminAuthTest($status === 403, "un cambio de rol debe revocar permisos aunque el JWT antiguo siga firmado");

$apiDir = __DIR__ . "/../api/";
$adminEndpoints = [
    "ads_create.php" => 'if (!file_exists($uploadDir))',
    "ads_delete.php" => "SELECT image FROM ads",
    "poll_create.php" => "INSERT INTO polls",
    "poll_delete.php" => "DELETE FROM polls",
    "poll_list.php" => "SELECT id, question, options, votes",
    "article_stats.php" => "SELECT",
    "article_create.php" => "move_uploaded_file",
    "article_edit.php" => "SELECT banner, banner_mobile, contenido",
    "article_delete.php" => "DELETE FROM articles",
    "article_exclusive_list.php" => 'getExclusiveArticles($conn, $claims)',
];

foreach ($adminEndpoints as $file => $operationMarker) {
    $source = file_get_contents($apiDir . $file);
    $guardPosition = strpos($source, '$claims = requireAdmin(');
    $operationPosition = strpos($source, $operationMarker);

    assertAdminAuthTest($guardPosition !== false, "$file debe exigir autorización administrativa compartida");
    assertAdminAuthTest($operationPosition !== false && $guardPosition < $operationPosition, "$file debe autorizar antes de consultar o modificar datos/archivos");
}

$changePasswordSource = file_get_contents($apiDir . "change_password.php");
assertAdminAuthTest(strpos($changePasswordSource, 'requireAdmin(') === false, "cambiar la contraseña propia no debe exigir rol admin");
assertAdminAuthTest(strpos($changePasswordSource, 'validateBearerToken(') !== false, "cambiar contraseña debe exigir JWT válido");
$validateTokenSource = file_get_contents($apiDir . "validate_token.php");
assertAdminAuthTest(strpos($validateTokenSource, 'requireAdmin(') === false, "validar un token no debe exigir rol admin");
assertAdminAuthTest(strpos($validateTokenSource, 'validateBearerToken(') !== false, "validate_token debe reutilizar la validación JWT compartida");

$articleGetSource = file_get_contents($apiDir . "article_get.php");
$publicArticleLookup = strpos($articleGetSource, 'getArticleById($conn, $id)');
$exclusiveAdminGate = strpos($articleGetSource, 'requireAdmin($conn, $_ENV["SECRET_KEY"])');
assertAdminAuthTest($publicArticleLookup !== false && $exclusiveAdminGate !== false && $publicArticleLookup < $exclusiveAdminGate, "article_get debe consultar primero la vía pública y proteger los exclusivos por ID");
assertAdminAuthTest(strpos($articleGetSource, 'getExclusiveArticleByShareToken($conn, $token)') !== false, "el acceso por enlace compartible debe conservarse");

$publicEndpoints = [
    "ads_get.php" => "SELECT * FROM ads",
    "poll_get_active.php" => "SELECT * FROM polls",
    "poll_vote.php" => "UPDATE polls SET votes",
    "article_list.php" => "WHERE is_exclusive = 0",
    "article_videos.php" => "WHERE is_exclusive = 0",
];

foreach ($publicEndpoints as $file => $publicMarker) {
    $source = file_get_contents($apiDir . $file);
    assertAdminAuthTest(strpos($source, 'requireAdmin(') === false, "$file debe seguir siendo público sin rol admin");
    assertAdminAuthTest(strpos($source, $publicMarker) !== false, "$file debe conservar su operación pública");
}

$frontendDir = __DIR__ . "/../../frontend/src/components/admin/";
$roleAwareComponents = [
    "AdsAdmin.jsx", "PollCreate.jsx", "PollList.jsx", "ArticleStats.jsx",
    "ArticlesAdmin.jsx", "ExclusiveArticles.jsx", "ArticleCreator.jsx",
];
foreach ($roleAwareComponents as $file) {
    $source = file_get_contents($frontendDir . $file);
    assertAdminAuthTest(strpos($source, "403") !== false, "$file debe diferenciar falta de permisos (403)");
    assertAdminAuthTest(strpos($source, 'status === 401') !== false, "$file debe conservar manejo de sesión inválida (401)");
}

$adsAdminSource = file_get_contents($frontendDir . "AdsAdmin.jsx");
$publicAdsStart = strpos($adsAdminSource, "const fetchAds");
$publicAdsEnd = strpos($adsAdminSource, "useEffect(() =>", $publicAdsStart);
$publicAdsFetch = substr($adsAdminSource, $publicAdsStart, $publicAdsEnd - $publicAdsStart);
assertAdminAuthTest(strpos($publicAdsFetch, "Authorization") === false, "la lectura pública de anuncios no debe enviar JWT innecesariamente");

fwrite(STDOUT, "OK: roles, JWT antiguos, guardas, efectos, rutas públicas y respuestas React verificados.\n");
