<?php
// ✅ Cargar CORS + conexión DB
require_once __DIR__ . "/../config/headers.php";

try {
    // Revisar si se debe excluir el banner
    $excludeBanner = isset($_GET['exclude_banner']) && $_GET['exclude_banner'] == 1;

    $query = "SELECT id, slug, title, banner, tags, description, created_at, is_banner 
          FROM articles 
          WHERE is_exclusive = 0";

    if ($excludeBanner) {
        $query .= " AND is_banner = 0";
    }

    $query .= " ORDER BY created_at DESC";

    $stmt = $conn->prepare($query);
    $stmt->execute();
    $articulos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Opcional: agregar URL completa a los banners
    foreach ($articulos as &$articulo) {
        if (!empty($articulo['banner'])) {
            // Por ejemplo, si quieres rutas absolutas
            // $articulo['banner'] = $_ENV['FRONTEND_URL'] . '/' . $articulo['banner'];
        }
    }
    unset($articulo);

    echo json_encode($articulos);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al obtener artículos", "detail" => $e->getMessage()]);
}
