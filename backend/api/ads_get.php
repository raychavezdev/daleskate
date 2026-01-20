<?php
// ✅ Cargar CORS + conexión a DB
require_once __DIR__ . "/../config/headers.php";

try {
    // 🔍 Consultar todos los anuncios
    $stmt = $conn->prepare("SELECT * FROM ads ORDER BY id DESC");
    $stmt->execute();
    $ads = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 🚀 Retornar JSON
    echo json_encode($ads);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al obtener los anuncios: " . $e->getMessage()]);
}
