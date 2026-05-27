<?php
require_once __DIR__ . "/../config/headers.php";

$stmt = $conn->prepare("SELECT * FROM articles WHERE is_banner = 1 LIMIT 1");
$stmt->execute();
$banner = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode($banner ?: null);