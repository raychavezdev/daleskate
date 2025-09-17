<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json; charset=UTF-8");

require_once("../config/db.php");

try {
    $query = "SELECT id, title, banner, tags, description, contenido, created_at 
              FROM articles 
              ORDER BY created_at DESC 
              LIMIT 20"; // Ajusta el límite según necesites
    $stmt = $conn->prepare($query);
    $stmt->execute();

    $articulos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $baseUrl = "http://localhost/daleskate/backend/";

    $videos = [];

    foreach ($articulos as &$articulo) {
        if (!empty($articulo['banner'])) {
            $articulo['banner'] = $baseUrl . $articulo['banner'];
        }

        $articulo['contenido'] = json_decode($articulo['contenido'], true);

        // 🔎 Revisar si el artículo tiene algún bloque de video
        if (is_array($articulo['contenido'])) {
            $hasVideo = false;
            foreach ($articulo['contenido'] as $block) {
                if (isset($block['tipo']) && ($block['tipo'] === "video" || $block['tipo'] === "video_externo")) {
                    $hasVideo = true;
                    break;
                }
            }
            if ($hasVideo) {
                $videos[] = $articulo;
            }
        }
    }

    echo json_encode($videos);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al obtener artículos: " . $e->getMessage()]);
}
