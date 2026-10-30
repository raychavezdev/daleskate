<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

function integrationSeedFail(string $message): void
{
    fwrite(STDERR, "ERROR: {$message}\n");
    exit(1);
}

$host = getenv('DALESKATE_TEST_DB_HOST');
$database = getenv('DALESKATE_TEST_DB_NAME');
$username = getenv('DALESKATE_TEST_DB_USER');
$dbPassword = getenv('DALESKATE_TEST_DB_PASS');
$adminPassword = getenv('DALESKATE_TEST_ADMIN_PASSWORD');
$editorPassword = getenv('DALESKATE_TEST_EDITOR_PASSWORD');

if (!in_array($host, ['127.0.0.1', 'localhost', '::1'], true)) {
    integrationSeedFail('DALESKATE_TEST_DB_HOST debe señalar explícitamente a este equipo.');
}

if ($database !== 'daleskate_test') {
    integrationSeedFail('DALESKATE_TEST_DB_NAME debe ser exactamente daleskate_test.');
}

foreach ([
    'DALESKATE_TEST_DB_USER' => $username,
    'DALESKATE_TEST_DB_PASS' => $dbPassword,
    'DALESKATE_TEST_ADMIN_PASSWORD' => $adminPassword,
    'DALESKATE_TEST_EDITOR_PASSWORD' => $editorPassword,
] as $name => $value) {
    if (!is_string($value) || $value === '') {
        integrationSeedFail("Falta la variable requerida {$name}.");
    }
}

$pdo = null;
$copiedImage = false;
$createdAdsDirectory = false;
$imagePath = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'uploads'
    . DIRECTORY_SEPARATOR . 'ads' . DIRECTORY_SEPARATOR . 'integration-ad.svg';

try {
    $pdo = new PDO(
        "mysql:host={$host};dbname={$database};charset=utf8mb4",
        $username,
        $dbPassword,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    if ($pdo->query('SELECT DATABASE()')->fetchColumn() !== 'daleskate_test') {
        integrationSeedFail('La conexión no seleccionó daleskate_test; no se insertaron datos.');
    }

    $requiredTables = ['users', 'articles', 'article_views', 'ads', 'polls'];
    $existingTables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    $missingTables = array_diff($requiredTables, $existingTables);
    if ($missingTables !== []) {
        integrationSeedFail('Faltan tablas del fixture; aplica primero integration_schema.sql.');
    }

    $fixtureUsers = $pdo->prepare(
        'SELECT COUNT(*) FROM users WHERE username IN (?, ?)'
    );
    $fixtureUsers->execute(['integration-admin', 'integration-editor']);
    $fixtureArticles = $pdo->prepare(
        'SELECT COUNT(*) FROM articles WHERE slug IN (?, ?)'
    );
    $fixtureArticles->execute(['integration-public-article', 'integration-exclusive-article']);
    $fixtureAd = $pdo->prepare('SELECT COUNT(*) FROM ads WHERE image = ?');
    $fixtureAd->execute(['integration-ad.svg']);
    $fixturePoll = $pdo->prepare('SELECT COUNT(*) FROM polls WHERE question = ?');
    $fixturePoll->execute(['Encuesta de integración local']);

    if ((int)$fixtureUsers->fetchColumn() !== 0
        || (int)$fixtureArticles->fetchColumn() !== 0
        || (int)$fixtureAd->fetchColumn() !== 0
        || (int)$fixturePoll->fetchColumn() !== 0) {
        integrationSeedFail('Ya existen registros fixture; no se modificó ningún registro.');
    }

    $fixtureImage = __DIR__ . DIRECTORY_SEPARATOR . 'integration_ad.svg';
    if (file_exists($imagePath)) {
        integrationSeedFail('Ya existe el archivo uploads/ads/integration-ad.svg; no se sobrescribió.');
    }

    $adsDirectory = dirname($imagePath);
    if (!is_dir($adsDirectory)) {
        if (!mkdir($adsDirectory, 0775, true) && !is_dir($adsDirectory)) {
            throw new RuntimeException('No fue posible preparar el directorio local de anuncios.');
        }
        $createdAdsDirectory = true;
    }

    if (!copy($fixtureImage, $imagePath)) {
        throw new RuntimeException('No fue posible copiar la imagen fixture local.');
    }
    $copiedImage = true;

    $pdo->beginTransaction();

    $adminHash = password_hash($adminPassword, PASSWORD_BCRYPT);
    $editorHash = password_hash($editorPassword, PASSWORD_BCRYPT);
    if ($adminHash === false || $editorHash === false) {
        throw new RuntimeException('No fue posible generar los hashes de prueba.');
    }

    $insertUser = $pdo->prepare(
        'INSERT INTO users (username, role, password) VALUES (?, ?, ?)'
    );
    $insertUser->execute([
        'integration-admin',
        'admin',
        $adminHash,
    ]);
    $insertUser->execute([
        'integration-editor',
        'editor',
        $editorHash,
    ]);

    $insertArticle = $pdo->prepare(
        'INSERT INTO articles
            (title, slug, tags, banner, banner_mobile, description, contenido,
             is_banner, is_exclusive, exclusive_token)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $insertArticle->execute([
        'Artículo público de integración',
        'integration-public-article',
        'integración, pruebas',
        null,
        null,
        '<p>Contenido público ficticio de integración.</p>',
        '[]',
        1,
        0,
        null,
    ]);
    $insertArticle->execute([
        'Artículo exclusivo de integración',
        'integration-exclusive-article',
        'integración, exclusivo',
        null,
        null,
        '<p>Contenido exclusivo ficticio de integración.</p>',
        '[]',
        0,
        1,
        'integration-share-token-only',
    ]);

    $publicArticleId = (int)$pdo->lastInsertId();
    $insertView = $pdo->prepare('INSERT INTO article_views (article_id) VALUES (?)');
    $insertView->execute([$publicArticleId]);
    $insertView->execute([$publicArticleId]);

    $insertAd = $pdo->prepare('INSERT INTO ads (image, link) VALUES (?, ?)');
    $insertAd->execute(['integration-ad.svg', 'https://example.invalid/integration']);

    $options = ['Opción A', 'Opción B'];
    $insertPoll = $pdo->prepare(
        'INSERT INTO polls (question, options, votes, expires_at) VALUES (?, ?, ?, ?)'
    );
    $insertPoll->execute([
        'Encuesta de integración local',
        json_encode($options, JSON_UNESCAPED_UNICODE),
        json_encode(array_fill_keys($options, 0), JSON_UNESCAPED_UNICODE),
        null,
    ]);

    $pdo->commit();
    fwrite(STDOUT, "Datos ficticios cargados en daleskate_test.\n");
} catch (Throwable $error) {
    try {
        if ($pdo instanceof PDO && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
    } catch (Throwable $rollbackError) {
    }

    if ($copiedImage && file_exists($imagePath)) {
        @unlink($imagePath);
    }
    if ($createdAdsDirectory && is_dir(dirname($imagePath))) {
        @rmdir(dirname($imagePath));
    }

    integrationSeedFail('No se pudo completar el seed; revisa la conexión y el esquema de pruebas.');
}
