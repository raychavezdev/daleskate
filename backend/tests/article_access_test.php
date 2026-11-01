<?php

require_once __DIR__ . "/../vendor/autoload.php";
require_once __DIR__ . "/../config/authentication.php";
require_once __DIR__ . "/../config/article_access.php";

use Firebase\JWT\JWT;

function assertArticleAccessTest(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FALLO: $message\n");
        exit(1);
    }
}

$db = new PDO("sqlite::memory:");
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->exec(
    "CREATE TABLE articles (
        id INTEGER PRIMARY KEY,
        title TEXT,
        slug TEXT,
        tags TEXT,
        banner TEXT,
        banner_mobile TEXT,
        description TEXT,
        contenido TEXT,
        created_at TEXT,
        is_banner INTEGER,
        is_exclusive INTEGER,
        exclusive_token TEXT,
        status TEXT NOT NULL DEFAULT 'published'
    )"
);
$db->exec("CREATE TABLE users (id INTEGER PRIMARY KEY, role TEXT)");
$db->exec("INSERT INTO users (id, role) VALUES (1, 'admin'), (2, 'editor')");

$insert = $db->prepare(
    "INSERT INTO articles
        (id, title, slug, tags, banner, banner_mobile, description, contenido,
         created_at, is_banner, is_exclusive, exclusive_token, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);
$insert->execute([
    20, "Artículo exclusivo ficticio", "exclusivo-ficticio", "prueba",
    "exclusive.jpg", null, "Descripción privada", "[]", "2026-01-02", 1, 1,
    "share-token-ficticio", "published",
]);
$insert->execute([
    10, "Artículo público ficticio", "publico-ficticio", "prueba",
    "public.jpg", null, "Descripción pública", "[]", "2026-01-01", 1, 0, null, "published",
]);
$insert->execute([
    30, "Borrador exclusivo ficticio", "borrador-exclusivo", "",
    null, null, "No público", "[]", "2026-01-03", 1, 1,
    "draft-share-token-ficticio", "draft",
]);

$testSecret = "article-access-test-only-secret";
$adminIssuedAt = time();
$validJwt = JWT::encode([
    "iat" => $adminIssuedAt,
    "exp" => $adminIssuedAt + DALESKATE_JWT_LIFETIME_SECONDS,
    "data" => ["id" => 1, "username" => "test-admin", "role" => "admin"],
], $testSecret, "HS256");
$adminAuthorization = authorizeAdminRequest($db, "Bearer " . $validJwt, $testSecret);
$validClaims = $adminAuthorization[1];
assertArticleAccessTest($validClaims !== null, "JWT válido debe verificarse");
assertArticleAccessTest($adminAuthorization[0] === 200, "rol admin actual debe autorizar la edición exclusiva");
assertArticleAccessTest(validateBearerToken(null, $testSecret) === null, "JWT ausente debe rechazarse");
assertArticleAccessTest(validateBearerToken("Basic " . $validJwt, $testSecret) === null, "esquema no Bearer debe rechazarse");
assertArticleAccessTest(validateBearerToken("Bearer token-inválido", $testSecret) === null, "JWT malformado debe rechazarse");

$parts = explode('.', $validJwt);
$parts[2] = ($parts[2][0] === 'A' ? 'B' : 'A') . substr($parts[2], 1);
$alteredJwt = implode('.', $parts);
assertArticleAccessTest(validateBearerToken("Bearer " . $alteredJwt, $testSecret) === null, "JWT alterado debe rechazarse");

$publicArticle = getArticleById($db, 10);
assertArticleAccessTest($publicArticle !== null, "artículo público por ID debe estar disponible");
assertArticleAccessTest(!array_key_exists("exclusive_token", $publicArticle), "respuesta de artículo por ID no debe incluir token exclusivo");
assertArticleAccessTest(getArticleById($db, 20) === null, "artículo exclusivo por ID sin JWT debe ocultarse");
assertArticleAccessTest(getArticleById($db, 30) === null, "borrador por ID debe ocultarse sin JWT");
$adminArticle = getArticleById($db, 20, $adminAuthorization[0] === 200);
assertArticleAccessTest($adminArticle !== null, "artículo exclusivo por ID con JWT válido debe estar disponible");
$editorJwt = JWT::encode([
    "iat" => $editorIssuedAt = time(),
    "exp" => $editorIssuedAt + DALESKATE_JWT_LIFETIME_SECONDS,
    "data" => ["id" => 2, "username" => "test-editor", "role" => "editor"],
], $testSecret, "HS256");
$editorAuthorization = authorizeAdminRequest($db, "Bearer " . $editorJwt, $testSecret);
assertArticleAccessTest($editorAuthorization[0] === 403, "rol no administrativo no debe autorizar acceso exclusivo por ID");
assertArticleAccessTest(getArticleById($db, 20, $editorAuthorization[0] === 200) === null, "JWT de editor no debe cargar artículo exclusivo por ID");

$sharedArticle = getExclusiveArticleByShareToken($db, "share-token-ficticio");
assertArticleAccessTest($sharedArticle !== null, "token compartible válido debe dar acceso al artículo");
assertArticleAccessTest(!array_key_exists("exclusive_token", $sharedArticle), "respuesta por token compartible no debe repetir el token");
assertArticleAccessTest(getExclusiveArticleByShareToken($db, "token-incorrecto") === null, "token compartible inválido debe rechazarse");
assertArticleAccessTest(getExclusiveArticleByShareToken($db, "draft-share-token-ficticio") === null, "enlace compartible no debe abrir borrador exclusivo");
assertArticleAccessTest(getArticleById($db, 30, true, true)['status'] === "draft", "administrador puede consultar borrador por ID");

assertArticleAccessTest(getExclusiveArticles($db, null) === null, "listado exclusivo sin JWT debe rechazarse");
$exclusiveList = getExclusiveArticles($db, $validClaims);
assertArticleAccessTest(is_array($exclusiveList) && count($exclusiveList) === 1, "listado exclusivo con JWT válido debe omitir borradores");
assertArticleAccessTest($exclusiveList[0]["exclusive_token"] === "share-token-ficticio", "el panel debe recibir el token que necesita para compartir");

$banner = getPublicBannerArticle($db);
assertArticleAccessTest($banner !== null && (int)$banner["id"] === 10, "banner debe elegir solo artículo público");
assertArticleAccessTest(!array_key_exists("exclusive_token", $banner), "banner no debe exponer token exclusivo");
assertArticleAccessTest(!array_key_exists("contenido", $banner), "banner no debe exponer contenido innecesario");

fwrite(STDOUT, "OK: validación JWT, artículos públicos/exclusivos y banner verificados.\n");
