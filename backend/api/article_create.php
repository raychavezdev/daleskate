<?php
require_once __DIR__ . "/../config/headers.php";
require_once __DIR__ . "/../vendor/autoload.php";

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
require_once __DIR__ . "/../config/authentication.php";
require_once __DIR__ . "/../config/article_workflow.php";

$claims = requireAdmin($conn, requireSecretKey());
$title = trim((string)($_POST['title'] ?? ''));
$tags = trim((string)($_POST['tags'] ?? ''));
$status = normalizeArticleStatus($_POST['status'] ?? null);
$description = $_POST['description'] ?? '';
$contenido = isset($_POST['contenido']) ? json_decode($_POST['contenido'], true) : [];
$is_exclusive = isset($_POST['is_exclusive']) ? (int)$_POST['is_exclusive'] : 0;
$is_banner = isset($_POST['is_banner']) ? (int)$_POST['is_banner'] : 0;

if ($status === null || !is_array($contenido)) {
    http_response_code(400);
    echo json_encode(["error" => "Datos de artículo inválidos"]);
    exit;
}

if ($status === 'published') {
    $errors = articlePublicationErrors([
        'title' => $title,
        'tags' => $tags,
        'is_banner' => $is_banner,
    ], !empty($_FILES['banner']['name']), !empty($_FILES['banner_mobile']['name']));
    if ($errors !== []) {
        http_response_code(422);
        echo json_encode(["error" => "El artículo no está completo para publicarse", "details" => $errors], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

$slug = createUniqueArticleSlug($conn, $title);

$exclusive_token = null;
if ($is_exclusive === 1) {
    $exclusive_token = bin2hex(random_bytes(32));
}

$articleId = time();

$bannerUrl = null;
if (isset($_FILES['banner'])) {
    $banner = $_FILES['banner'];
    $bannerDir = __DIR__ . "/../uploads/banners/";
    if (!is_dir($bannerDir)) mkdir($bannerDir, 0777, true);

    $bannerName = $articleId . "_" . basename($banner['name']);
    $bannerPath = $bannerDir . $bannerName;
    move_uploaded_file($banner['tmp_name'], $bannerPath);

    $bannerUrl = "uploads/banners/" . rawurlencode($bannerName);
}

$bannerMobileUrl = null;
if (isset($_FILES['banner_mobile'])) {
    $bannerMobile = $_FILES['banner_mobile'];
    $bannerDir = __DIR__ . "/../uploads/banners/";
    if (!is_dir($bannerDir)) mkdir($bannerDir, 0777, true);

    $bannerMobileName = $articleId . "_mobile_" . basename($bannerMobile['name']);
    $bannerMobilePath = $bannerDir . $bannerMobileName;
    move_uploaded_file($bannerMobile['tmp_name'], $bannerMobilePath);

    $bannerMobileUrl = "uploads/banners/" . rawurlencode($bannerMobileName);
}

$articleFolder = __DIR__ . "/../uploads/articles/" . $articleId . "/";
if (!is_dir($articleFolder)) mkdir($articleFolder, 0777, true);

foreach ($contenido as $i => &$bloque) {

    if ($bloque['tipo'] === "imagen") {
        $fileKey = $bloque['valor'] ?? null;

        if ($fileKey && isset($_FILES[$fileKey])) {
            $file = $_FILES[$fileKey];
            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $allowed = ["jpg", "jpeg", "png", "gif"];

            if (!in_array($ext, $allowed)) {
                http_response_code(400);
                echo json_encode(["error" => "Formato no permitido ($ext)"]);
                exit;
            }

            $fileName = $articleId . "_{$i}_" . basename($file['name']);
            $filePath = $articleFolder . $fileName;
            move_uploaded_file($file['tmp_name'], $filePath);

            $bloque['valor'] = "uploads/articles/$articleId/" . rawurlencode($fileName);
        }
    }

    if ($bloque['tipo'] === "video_externo") {
        $fileKey = $bloque['preview'] ?? null;

        if ($fileKey && isset($_FILES[$fileKey])) {
            $file = $_FILES[$fileKey];
            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $allowed = ["jpg", "jpeg", "png", "gif"];

            if (!in_array($ext, $allowed)) {
                http_response_code(400);
                echo json_encode(["error" => "Formato de miniatura no permitido ($ext)"]);
                exit;
            }

            $fileName = $articleId . "_thumb_" . basename($file['name']);
            $filePath = $articleFolder . $fileName;
            move_uploaded_file($file['tmp_name'], $filePath);

            $bloque['preview'] = "uploads/articles/$articleId/" . rawurlencode($fileName);
        } else {
            $bloque['preview'] = $bloque['preview'] ?? "";
        }
    }
}
unset($bloque);

if ($is_banner === 1 && $status === 'published') {
    $conn->exec("UPDATE articles SET is_banner = 0 WHERE is_banner = 1 AND status = 'published'");
}


$stmt = $conn->prepare("
    INSERT INTO articles 
    (title, slug, tags, banner, banner_mobile, description, contenido, is_banner, is_exclusive, exclusive_token, status)
    VALUES 
    (:title, :slug, :tags, :banner, :banner_mobile, :description, :contenido, :is_banner, :is_exclusive, :exclusive_token, :status)
");

$contenidoJson = json_encode($contenido, JSON_UNESCAPED_UNICODE);

$stmt->bindParam(":title", $title);
$stmt->bindParam(":slug", $slug);
$stmt->bindParam(":tags", $tags);
$stmt->bindParam(":banner", $bannerUrl);
$stmt->bindParam(":banner_mobile", $bannerMobileUrl);
$stmt->bindParam(":description", $description);
$stmt->bindParam(":contenido", $contenidoJson);
$stmt->bindParam(":is_banner", $is_banner, PDO::PARAM_INT);
$stmt->bindParam(":is_exclusive", $is_exclusive, PDO::PARAM_INT);
$stmt->bindParam(":exclusive_token", $exclusive_token);
$stmt->bindParam(":status", $status);

try {
    $stmt->execute();
    $articleId = (int)$conn->lastInsertId();

    echo json_encode([
        "message" => "Artículo creado correctamente",
        "article_id" => $articleId,
        "status" => $status,
        "exclusive_token" => $exclusive_token
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Error al guardar artículo",
        "detail" => $e->getMessage()
    ]);
}
