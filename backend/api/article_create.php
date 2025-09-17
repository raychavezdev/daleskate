<?php
// --- CORS ---
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "../config/db.php";
require_once "../vendor/autoload.php";

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

$secret_key = "TU_SECRET_KEY_AQUI";

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

// ====== 3️⃣ Guardar banner ======
$bannerUrl = null;
if (isset($_FILES['banner'])) {
    $banner = $_FILES['banner'];
    $bannerDir = "../uploads/banners/";
    if (!is_dir($bannerDir)) mkdir($bannerDir, 0777, true);

    $bannerName = time() . "_" . basename($banner['name']);

    // Ruta en disco (para mover el archivo físicamente)
    $bannerPath = $bannerDir . $bannerName;

    // URL pública (para guardar en DB y usar en React)
    $bannerUrl = "http://localhost/daleskate/backend/uploads/banners/" . rawurlencode($bannerName);

    move_uploaded_file($banner['tmp_name'], $bannerPath);
}

// ====== 4️⃣ Guardar imágenes del contenido ======
$articleFolder = "../uploads/articles/" . time() . "/";
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

            // URL pública
            $bloque['valor'] = "http://localhost/daleskate/backend/uploads/articles/" . time() . "/" . rawurlencode($fileName);
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

            // URL pública
            $bloque['preview'] = "http://localhost/daleskate/backend/uploads/articles/" . time() . "/" . rawurlencode($fileName);
        } else {
            $bloque['preview'] = $bloque['preview'] ?? "";
        }
    }
}
unset($bloque);

// ====== 5️⃣ Flag banner único ======
$is_banner = isset($_POST['is_banner']) ? (int)$_POST['is_banner'] : 0;
if ($is_banner === 1) {
    $conn->exec("UPDATE articles SET is_banner = 0 WHERE is_banner = 1");
}

// ====== 6️⃣ Insertar en DB ======
$stmt = $conn->prepare("
    INSERT INTO articles (title, tags, banner, description, contenido, is_banner)
    VALUES (:title, :tags, :banner, :description, :contenido, :is_banner)
");

$stmt->bindParam(":title", $title);
$stmt->bindParam(":tags", $tags);
$stmt->bindParam(":banner", $bannerUrl);
$stmt->bindParam(":description", $description);

$contenidoJson = json_encode($contenido);
$stmt->bindParam(":contenido", $contenidoJson);

$stmt->bindParam(":is_banner", $is_banner, PDO::PARAM_INT);

try {
    $stmt->execute();
    echo json_encode(["message" => "Artículo creado correctamente"]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al guardar artículo", "detail" => $e->getMessage()]);
}
