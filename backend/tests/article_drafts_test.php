<?php

require_once __DIR__ . '/../config/article_workflow.php';

function assertArticleDraftTest(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FALLO: {$message}\n");
        exit(1);
    }
}

$db = new PDO('sqlite::memory:');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->exec("CREATE TABLE articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    tags TEXT NOT NULL,
    banner TEXT NULL,
    banner_mobile TEXT NULL,
    description TEXT NOT NULL,
    contenido TEXT NOT NULL,
    is_banner INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published'
)");

assertArticleDraftTest(normalizeArticleStatus('draft') === 'draft', 'acepta guardar borrador');
assertArticleDraftTest(normalizeArticleStatus('published') === 'published', 'acepta publicar');
assertArticleDraftTest(normalizeArticleStatus('other') === null, 'rechaza estados desconocidos');

$incompleteDraft = ['title' => '', 'tags' => '', 'is_banner' => 0];
assertArticleDraftTest(articlePublicationErrors($incompleteDraft) !== [], 'artículo incompleto no puede publicarse');
assertArticleDraftTest(articlePublicationErrors(['title' => 'Completo', 'tags' => 'skate', 'is_banner' => 0]) === [], 'artículo válido puede publicarse');
assertArticleDraftTest(articlePublicationErrors(['title' => 'Banner', 'tags' => 'skate', 'is_banner' => 1]) !== [], 'banner publicado requiere portada');

$draftSlug = createUniqueArticleSlug($db, '');
assertArticleDraftTest(str_starts_with($draftSlug, 'borrador-'), 'borrador sin título recibe slug de respaldo');
$insert = $db->prepare("INSERT INTO articles (title, slug, tags, description, contenido, status) VALUES (?, ?, ?, ?, ?, ?)");
$insert->execute(['', $draftSlug, '', '', '[]', 'draft']);
assertArticleDraftTest(createUniqueArticleSlug($db, '') !== $draftSlug, 'slug de borrador vacío no colisiona');

$firstSlug = createUniqueArticleSlug($db, 'Artículo de prueba');
$insert->execute(['Artículo de prueba', $firstSlug, 'skate', '', '[]', 'draft']);
$secondSlug = createUniqueArticleSlug($db, 'Artículo de prueba');
assertArticleDraftTest($secondSlug !== $firstSlug, 'slugs repetidos reciben sufijo único');

$update = $db->prepare('UPDATE articles SET title = ?, tags = ?, contenido = ?, status = ? WHERE id = ?');
$update->execute(['Título editado', 'skate, calle', '[{"tipo":"texto","valor":"contenido ficticio"}]', 'draft', 1]);
$saved = $db->query('SELECT title, tags, contenido, status FROM articles WHERE id = 1')->fetch(PDO::FETCH_ASSOC);
assertArticleDraftTest($saved['status'] === 'draft' && $saved['title'] === 'Título editado' && str_contains($saved['contenido'], 'contenido ficticio'), 'editar borrador conserva los campos enviados');
$update->execute(['Artículo listo', 'skate', '[]', 'published', 1]);
assertArticleDraftTest($db->query('SELECT status FROM articles WHERE id = 1')->fetchColumn() === 'published', 'borrador válido cambia a publicado');
$update->execute(['Artículo listo', 'skate', '[]', 'draft', 1]);
assertArticleDraftTest($db->query('SELECT status FROM articles WHERE id = 1')->fetchColumn() === 'draft', 'publicado puede volver a borrador');
$db->exec("INSERT INTO articles (title, slug, tags, description, contenido) VALUES ('Artículo anterior', 'articulo-anterior', 'skate', '', '[]')");
assertArticleDraftTest($db->query("SELECT status FROM articles WHERE slug = 'articulo-anterior'")->fetchColumn() === 'published', 'registro anterior sin estado conserva publicación por default');

$api = __DIR__ . '/../api/';
$publicQueries = [
    'article_list.php' => "status = 'published'",
    'article_videos.php' => "status = 'published'",
    'article_view.php' => "status = 'published'",
];
foreach ($publicQueries as $file => $marker) {
    assertArticleDraftTest(str_contains(file_get_contents($api . $file), $marker), "{$file} limita consultas públicas a publicados");
}
$articleGet = file_get_contents($api . 'article_get.php');
assertArticleDraftTest(str_contains($articleGet, 'getArticleById($conn, $id, true, true)'), 'carga administrativa puede consultar borradores');
assertArticleDraftTest(str_contains($articleGet, 'requireAdmin($conn, requireSecretKey())'), 'carga de contenido no público valida admin');
$access = file_get_contents(__DIR__ . '/../config/article_access.php');
assertArticleDraftTest(str_contains($access, "exclusive_token = :token AND is_exclusive = 1 AND status = 'published'") && str_contains($access, "is_banner = 1 AND is_exclusive = 0 AND status = 'published'"), 'token compartible y banner restringen estados públicos');

fwrite(STDOUT, "OK: flujo de borradores, slugs y controles de publicación verificados.\n");
