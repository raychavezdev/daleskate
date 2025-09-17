<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json; charset=UTF-8");

require_once("../config/db.php");

try {
    $excludeBanner = isset($_GET['exclude_banner']) && $_GET['exclude_banner'] == 1;

    $query = "SELECT id, title, banner, tags, description, created_at, is_banner FROM articles";
    if ($excludeBanner) {
        $query .= " WHERE is_banner = 0";
    }
    $query .= " ORDER BY created_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute();

    $articulos = $stmt->fetchAll(PDO::FETCH_ASSOC);


    echo json_encode($articulos);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al obtener artículos: " . $e->getMessage()]);
}
