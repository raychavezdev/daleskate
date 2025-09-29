<?php
// ====== CORS y headers ======
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Responder preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "../config/db.php";

$stmt = $conn->prepare("SELECT * FROM articles WHERE is_banner = 1 LIMIT 1");
$stmt->execute();
$banner = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode($banner ?: null);