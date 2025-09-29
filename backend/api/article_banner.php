<?php
// ✅ Cargar CORS + conexión a DB
require_once __DIR__ . "/../config/headers.php";

// ====== Consultar artículo que sea banner ======
$stmt = $conn->prepare("SELECT * FROM articles WHERE is_banner = 1 LIMIT 1");
$stmt->execute();
$banner = $stmt->fetch(PDO::FETCH_ASSOC);

// 🚀 Retornar JSON
echo json_encode($banner ?: null);