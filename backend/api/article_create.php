<?php
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

// ====== 2️⃣ Leer datos de FormData ======
$title = $_POST['title'] ?? null;
$tags = $_POST['tags'] ?? null;
$description = $_POST['description'] ?? '';
$contenido = isset($_POST['contenido']) ? json_decode($_POST['contenido'], true) : [];

// ====== 3️⃣ Validar campos obligatorios ======
if (!$title || !$tags) {
    http_response_code(400);
    echo json_encode(["error" => "Faltan datos obligatorios"]);
    exit;
}

// ====== 4️⃣ Guardar banner ======
$bannerPath = null;
if (isset($_FILES['banner'])) {
    $banner = $_FILES['banner'];
    $bannerDir = "../uploads/banners/";
    if (!is_dir($bannerDir)) mkdir($bannerDir, 0777, true);

    $bannerName = time() . "_" . basename($banner['name']);
    $bannerPath = "uploads/banners/" . $bannerName;
    move_uploaded_file($banner['tmp_name'], "../" . $bannerPath);
}

// ====== 5️⃣ Guardar imágenes de bloques ======
$articleFolder = "../uploads/articles/" . time() . "/";
if (!is_dir($articleFolder)) mkdir($articleFolder, 0777, true);

foreach ($contenido as $i => &$bloque) {
    if ($bloque['tipo'] === "imagen") {
        $fileKey = $bloque['valor'];
        if (isset($_FILES[$fileKey])) {
            $file = $_FILES[$fileKey];
            $fileName = time() . "_{$i}_" . basename($file['name']);
            $filePath = $articleFolder . $fileName;
            move_uploaded_file($file['tmp_name'], $filePath);
            $bloque['valor'] = str_replace("../", "", $filePath);
        }
    }
}
unset($bloque);


// ====== 6️⃣ Insertar en DB ======
$stmt = $conn->prepare("
    INSERT INTO articles (title, tags, banner, description, contenido) 
    VALUES (:title, :tags, :banner, :description, :contenido)
");

$stmt->bindParam(":title", $title);
$stmt->bindParam(":tags", $tags);
$stmt->bindParam(":banner", $bannerPath);
$stmt->bindParam(":description", $description); // <-- nuevo bind
$contenidoJson = json_encode($contenido);
$stmt->bindParam(":contenido", $contenidoJson);


try {
    $stmt->execute();
    echo json_encode(["message" => "Artículo creado correctamente"]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al guardar artículo", "detail" => $e->getMessage()]);
}
