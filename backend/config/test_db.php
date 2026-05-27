<?php
require_once __DIR__ . '/db.php';

try {
    $stmt = $conn->query("SELECT NOW() AS fecha_actual");
    $result = $stmt->fetch();

    echo json_encode([
        "success" => true,
        "mensaje" => "Conexión exitosa",
        "fecha_actual" => $result['fecha_actual']
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}