<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json; charset=UTF-8");

require_once("../config/db.php");

try {
    // 1️⃣ Obtener todos los artículos
    $query = "SELECT id, title, banner, tags, description, contenido, created_at 
              FROM articles 
              ORDER BY created_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute();

    $articulos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $videos = [];

    // 2️⃣ Filtrar solo los que tengan bloques de video
    foreach ($articulos as $articulo) {
        $contenido = json_decode($articulo['contenido'], true);

        if (is_array($contenido)) {
            foreach ($contenido as $block) {
                if (isset($block['tipo']) && ($block['tipo'] === 'video' || $block['tipo'] === 'video_externo')) {
                    // ✅ Guardamos el artículo completo y salimos del loop de bloques
                    $videos[] = $articulo;
                    break;
                }
            }
        }
    }

    echo json_encode($videos);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al obtener artículos: " . $e->getMessage()]);
}
