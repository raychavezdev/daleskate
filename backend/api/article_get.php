<?php
require_once "../config/db.php";

// --- CORS (antes de cualquier salida) ---
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// --- Preflight (para OPTIONS) ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (!isset($_GET['id'])) {
    echo json_encode(["error" => "Falta el ID del artículo"]);
    exit;
}

$id = intval($_GET['id']);

try {
    $stmt = $conn->prepare("SELECT * FROM articles WHERE id = :id LIMIT 1");
    $stmt->execute([":id" => $id]);
    $articulo = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($articulo) {
        $baseUrl = "http://127.0.0.1/daleskate/backend/";

        // Banner
        if (!empty($articulo['banner'])) {
            $articulo['banner'] = $baseUrl . $articulo['banner'];
        }

        // Contenido dinámico
        if (!empty($articulo['contenido'])) {
            $contenido = json_decode($articulo['contenido'], true);
            if (is_array($contenido)) {
                foreach ($contenido as &$block) {
                    if ($block['tipo'] === "imagen" && !empty($block['src'])) {
                        $block['src'] = $baseUrl . $block['src'];
                    }
                }
                $articulo['contenido'] = $contenido;
            }
        }

        echo json_encode($articulo);
    } else {
        echo json_encode(["error" => "Artículo no encontrado"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
