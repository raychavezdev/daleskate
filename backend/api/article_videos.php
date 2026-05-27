<?php

require_once __DIR__ . "/../config/headers.php";

try {
    
    $query = "SELECT id, title, banner, tags, description, contenido, created_at 
              FROM articles
              WHERE is_exclusive = 0 
              ORDER BY created_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute();

    $articulos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $videos = [];

    
    foreach ($articulos as $articulo) {
        $contenido = json_decode($articulo['contenido'], true);

        if (is_array($contenido)) {
            foreach ($contenido as $block) {
                if (isset($block['tipo']) && ($block['tipo'] === 'video' || $block['tipo'] === 'video_externo')) {
                    
                    if (!empty($articulo['banner'])) {
                        
                    }
                    $videos[] = $articulo;
                    break; 
                }
            }
        }
    }

    echo json_encode($videos);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al obtener artículos con video", "detail" => $e->getMessage()]);
}
