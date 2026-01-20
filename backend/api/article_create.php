<?php
// ✅ Cargar CORS + conexión a DB
require_once __DIR__ . "/../config/headers.php";
require_once __DIR__ . "/../vendor/autoload.php";

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// ====== 1️⃣ Validar token ======
$headers = getallheaders();
if (!isset($headers['Authorization'])) {
    http_response_code(401);
    echo json_encode(["error" => "Token no proporcionado"]);
    exit;
}

$authHeader = $headers['Authorization'];
$parts = explode(" ", $authHeader);
$type = $parts[0] ?? '';
$token = $parts[1] ?? '';

if ($type !== "Bearer" || !$token) {
    http_response_code(401);
    echo json_encode(["error" => "Token inválido"]);
    exit;
}

$secret_key = $_ENV["SECRET_KEY"];

try {
    $decoded = JWT::decode($token, new Key($secret_key, 'HS256'));
    $user_id = $decoded->data->id;
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["error" => "Token inválido", "detail" => $e->getMessage()]);
    exit;
}

// ====== 2️⃣ Leer datos ======
$title = $_POST['title'] ?? null;
$tags = $_POST['tags'] ?? null;
$description = $_POST['description'] ?? '';
$contenido = isset($_POST['contenido']) ? json_decode($_POST['contenido'], true) : [];

if (!$title || !$tags) {
    http_response_code(400);
    echo json_encode(["error" => "Faltan datos obligatorios"]);
    exit;
}

// ====== 3️⃣ Generar ID único ======
$articleId = time();

// ====== 4️⃣ Guardar banner principal ======
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

// ====== 5️⃣ Guardar banner versión móvil ======
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

// ====== 6️⃣ Guardar imágenes/videos del contenido ======
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

// ====== 7️⃣ Bandera de banner único ======
$is_banner = isset($_POST['is_banner']) ? (int)$_POST['is_banner'] : 0;
if ($is_banner === 1) {
    $conn->exec("UPDATE articles SET is_banner = 0 WHERE is_banner = 1");
}

// ====== 8️⃣ Insertar en la base de datos ======
$stmt = $conn->prepare("
    INSERT INTO articles (title, tags, banner, banner_mobile, description, contenido, is_banner)
    VALUES (:title, :tags, :banner, :banner_mobile, :description, :contenido, :is_banner)
");

$stmt->bindParam(":title", $title);
$stmt->bindParam(":tags", $tags);
$stmt->bindParam(":banner", $bannerUrl);
$stmt->bindParam(":banner_mobile", $bannerMobileUrl);
$stmt->bindParam(":description", $description);

$contenidoJson = json_encode($contenido, JSON_UNESCAPED_UNICODE);
$stmt->bindParam(":contenido", $contenidoJson);
$stmt->bindParam(":is_banner", $is_banner, PDO::PARAM_INT);

try {
    $stmt->execute();
    echo json_encode(["message" => "Artículo creado correctamente"]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al guardar artículo", "detail" => $e->getMessage()]);
}
