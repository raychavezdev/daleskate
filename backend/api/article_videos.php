<?php
// ✅ Cargar CORS + conexión DB
require_once __DIR__ . "/../config/headers.php";

try {
    // 1️⃣ Obtener todos los artículos
    $query = "SELECT id, title, banner, tags, description, contenido, created_at 
              FROM articles
              WHERE is_exclusive = 0 
              ORDER BY created_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute();

    $articulos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $videos = [];

    // 2️⃣ Filtrar solo los artículos que tengan bloques de video
    foreach ($articulos as $articulo) {
        $contenido = json_decode($articulo['contenido'], true);

        if (is_array($contenido)) {
            foreach ($contenido as $block) {
                if (isset($block['tipo']) && ($block['tipo'] === 'video' || $block['tipo'] === 'video_externo')) {
                    // Opcional: agregar URL completa a banners
                    if (!empty($articulo['banner'])) {
                        // $articulo['banner'] = $_ENV['FRONTEND_URL'] . '/' . $articulo['banner'];
                    }
                    $videos[] = $articulo;
                    break; // Ya encontramos un bloque de video
                }
            }
        }
    }

    echo json_encode($videos);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al obtener artículos con video", "detail" => $e->getMessage()]);
}
