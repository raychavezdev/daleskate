<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json; charset=UTF-8");

require_once("../config/db.php");

try {
    $query = "SELECT id, title, banner, tags, description, created_at FROM articles ORDER BY created_at DESC LIMIT 10";
    $stmt = $conn->prepare($query);
    $stmt->execute();

    $articulos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 🔑 URL base (ajusta según tu entorno)
    $baseUrl = "http://localhost/daleskate/backend/";

    // Recorremos y actualizamos el campo banner
    foreach ($articulos as &$articulo) {
        if (!empty($articulo['banner'])) {
            $articulo['banner'] = $baseUrl . $articulo['banner'];
        }
    }

    echo json_encode($articulos);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al obtener artículos: " . $e->getMessage()]);
}
