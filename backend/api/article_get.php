<?php
// ✅ Cargar CORS + conexión DB
require_once __DIR__ . "/../config/headers.php";

// ====== 1️⃣ Verificar ID ======
if (!isset($_GET['id'])) {
    http_response_code(400);
    echo json_encode(["error" => "Falta el ID del artículo"]);
    exit;
}

$id = intval($_GET['id']);

try {
    $stmt = $conn->prepare("SELECT * FROM articles WHERE id = :id LIMIT 1");
    $stmt->bindParam(":id", $id, PDO::PARAM_INT);
    $stmt->execute();
    $articulo = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$articulo) {
        http_response_code(404);
        echo json_encode(["error" => "Artículo no encontrado"]);
        exit;
    }

    // ====== 2️⃣ Decodificar contenido ======
    if (!empty($articulo['contenido'])) {
        $contenido = json_decode($articulo['contenido'], true);
        if (is_array($contenido)) {
            foreach ($contenido as &$block) {
                // Si quieres, aquí podrías añadir $baseUrl delante de las rutas
                // $block['valor'] = $_ENV['FRONTEND_URL'] . '/' . $block['valor'];
            }
            unset($block);
            $articulo['contenido'] = $contenido;
        }
    }

    echo json_encode($articulo);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al obtener artículo", "detail" => $e->getMessage()]);
}