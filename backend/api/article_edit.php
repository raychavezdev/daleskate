<?php

require_once __DIR__ . "/../config/headers.php";
require_once __DIR__ . "/../vendor/autoload.php";

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
require_once __DIR__ . "/../config/authentication.php";
require_once __DIR__ . "/../config/article_workflow.php";


$claims = requireAdmin($conn, requireSecretKey());
$id = $_POST['id'] ?? null;
$title = trim((string)($_POST['title'] ?? ''));
$tags = trim((string)($_POST['tags'] ?? ''));
$requestedStatus = $_POST['status'] ?? null;
$description = $_POST['description'] ?? '';
$contenido = isset($_POST['contenido']) ? json_decode($_POST['contenido'], true) : null;

if (!$id) {
    http_response_code(400);
    echo json_encode(["error" => "ID de artículo requerido"]);
    exit;
}


$stmt = $conn->prepare("SELECT title, tags, banner, banner_mobile, contenido, is_banner, status FROM articles WHERE id = :id");
$stmt->bindParam(":id", $id, PDO::PARAM_INT);
$stmt->execute();
$article = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$article) {
    http_response_code(404);
    echo json_encode(["error" => "Artículo no encontrado"]);
    exit;
}

$currentBanner = $article['banner'];
$currentBannerMobile = $article['banner_mobile'];
$currentContenido = json_decode($article['contenido'], true);
$title = array_key_exists('title', $_POST) ? $title : $article['title'];
$tags = array_key_exists('tags', $_POST) ? $tags : $article['tags'];
$description = array_key_exists('description', $_POST) ? $description : '';
$contenido = $contenido ?? $currentContenido;
if (!is_array($contenido)) {
    http_response_code(400);
    echo json_encode(["error" => "Contenido de artículo inválido"]);
    exit;
}
$status = normalizeArticleStatus($requestedStatus, $article['status']);
$is_banner = isset($_POST['is_banner']) ? (int)$_POST['is_banner'] : (int)$article['is_banner'];
if ($status === null) {
    http_response_code(400);
    echo json_encode(["error" => "Estado de artículo inválido"]);
    exit;
}
if ($status === 'published') {
    $errors = articlePublicationErrors([
        'title' => $title,
        'tags' => $tags,
        'is_banner' => $is_banner,
        'banner' => $currentBanner,
        'banner_mobile' => $currentBannerMobile,
    ], !empty($_FILES['banner']['name']), !empty($_FILES['banner_mobile']['name']));
    if ($errors !== []) {
        http_response_code(422);
        echo json_encode(["error" => "El artículo no está completo para publicarse", "details" => $errors], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
$slug = createUniqueArticleSlug($conn, $title, (int)$id);




$bannerUrl = $currentBanner;
if (isset($_FILES['banner'])) {
    $banner = $_FILES['banner'];
    $bannerDir = __DIR__ . "/../uploads/banners/";
    if (!is_dir($bannerDir)) mkdir($bannerDir, 0777, true);

    $bannerName = time() . "_" . basename($banner['name']);
    $bannerPath = $bannerDir . $bannerName;
    move_uploaded_file($banner['tmp_name'], $bannerPath);

    $bannerUrl = "uploads/banners/" . rawurlencode($bannerName);
}


$bannerMobileUrl = $currentBannerMobile;
if (isset($_FILES['banner_mobile'])) {
    $bannerMobile = $_FILES['banner_mobile'];
    $bannerDir = __DIR__ . "/../uploads/banners/";
    if (!is_dir($bannerDir)) mkdir($bannerDir, 0777, true);

    $bannerMobileName = time() . "_mobile_" . basename($bannerMobile['name']);
    $bannerMobilePath = $bannerDir . $bannerMobileName;
    move_uploaded_file($bannerMobile['tmp_name'], $bannerMobilePath);

    $bannerMobileUrl = "uploads/banners/" . rawurlencode($bannerMobileName);
}


$articleFolder = __DIR__ . "/../uploads/articles/" . $id . "/";
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
                echo json_encode(["error" => "Formato de imagen no permitido ($ext)"]);
                exit;
            }
            $fileName = time() . "_{$i}_" . basename($file['name']);
            $filePath = $articleFolder . $fileName;
            move_uploaded_file($file['tmp_name'], $filePath);

            $bloque['valor'] = "uploads/articles/" . $id . "/" . rawurlencode($fileName);
        } elseif (isset($currentContenido[$i]['valor'])) {
            $bloque['valor'] = $currentContenido[$i]['valor'];
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
            $fileName = time() . "_thumb_" . basename($file['name']);
            $filePath = $articleFolder . $fileName;
            move_uploaded_file($file['tmp_name'], $filePath);

            $bloque['preview'] = "uploads/articles/" . $id . "/" . rawurlencode($fileName);
        } elseif (isset($currentContenido[$i]['preview'])) {
            $bloque['preview'] = $currentContenido[$i]['preview'];
        }
    }
}
unset($bloque);


if ($is_banner === 1 && $status === 'published') {
    $conn->exec("UPDATE articles SET is_banner = 0 WHERE is_banner = 1 AND status = 'published' AND id <> " . (int)$id);
}


$stmt = $conn->prepare("
    UPDATE articles 
    SET title = :title, slug = :slug, tags = :tags, banner = :banner, banner_mobile = :banner_mobile, description = :description, contenido = :contenido, is_banner = :is_banner, status = :status
    WHERE id = :id
");

$stmt->bindParam(":id", $id, PDO::PARAM_INT);
$stmt->bindParam(":title", $title);
$stmt->bindParam(":slug", $slug);
$stmt->bindParam(":tags", $tags);
$stmt->bindParam(":banner", $bannerUrl);
$stmt->bindParam(":banner_mobile", $bannerMobileUrl);
$stmt->bindParam(":description", $description);

$contenidoJson = json_encode($contenido);
$stmt->bindParam(":contenido", $contenidoJson);
$stmt->bindParam(":is_banner", $is_banner, PDO::PARAM_INT);
$stmt->bindParam(":status", $status);

try {
    $stmt->execute();
    echo json_encode(["message" => "Artículo actualizado correctamente"]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al actualizar artículo", "detail" => $e->getMessage()]);
}
