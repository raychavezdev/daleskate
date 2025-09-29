<?php
// ✅ Cargar CORS + conexión DB
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

// ✅ SECRET_KEY desde .env
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
$id = $_POST['id'] ?? null;
$title = $_POST['title'] ?? null;
$tags = $_POST['tags'] ?? null;
$description = $_POST['description'] ?? '';
$contenido = isset($_POST['contenido']) ? json_decode($_POST['contenido'], true) : [];

if (!$id || !$title || !$tags) {
    http_response_code(400);
    echo json_encode(["error" => "Faltan datos obligatorios"]);
    exit;
}

// ====== 3️⃣ Obtener artículo actual ======
$stmt = $conn->prepare("SELECT banner, contenido FROM articles WHERE id = :id");
$stmt->bindParam(":id", $id, PDO::PARAM_INT);
$stmt->execute();
$article = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$article) {
    http_response_code(404);
    echo json_encode(["error" => "Artículo no encontrado"]);
    exit;
}

$currentBanner = $article['banner'];
$currentContenido = json_decode($article['contenido'], true);

// ====== 4️⃣ Banner ======
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

// ====== 5️⃣ Guardar imágenes/videos del contenido ======
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

// ====== 6️⃣ Flag banner único ======
$is_banner = isset($_POST['is_banner']) ? (int)$_POST['is_banner'] : 0;
if ($is_banner === 1) {
    $conn->exec("UPDATE articles SET is_banner = 0 WHERE is_banner = 1");
}

// ====== 7️⃣ Actualizar en DB ======
$stmt = $conn->prepare("
    UPDATE articles 
    SET title = :title, tags = :tags, banner = :banner, description = :description, contenido = :contenido, is_banner = :is_banner
    WHERE id = :id
");

$stmt->bindParam(":id", $id, PDO::PARAM_INT);
$stmt->bindParam(":title", $title);
$stmt->bindParam(":tags", $tags);
$stmt->bindParam(":banner", $bannerUrl);
$stmt->bindParam(":description", $description);

$contenidoJson = json_encode($contenido);
$stmt->bindParam(":contenido", $contenidoJson);
$stmt->bindParam(":is_banner", $is_banner, PDO::PARAM_INT);

try {
    $stmt->execute();
    echo json_encode(["message" => "Artículo actualizado correctamente"]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al actualizar artículo", "detail" => $e->getMessage()]);
}