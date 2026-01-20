<?php
require_once __DIR__ . "/../config/headers.php";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;

    if (!$id) {
        echo json_encode(["error" => "ID no proporcionado"]);
        exit;
    }

    // Obtener nombre del archivo para eliminarlo también del servidor
    $stmt = $conn->prepare("SELECT image FROM ads WHERE id = ?");
    $stmt->execute([$id]);
    $ad = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($ad) {
        $filePath = __DIR__ . "/../uploads/ads/" . $ad['image'];
        if (file_exists($filePath)) {
            unlink($filePath); // elimina la imagen del servidor
        }

        // Eliminar el registro de la BD
        $stmt = $conn->prepare("DELETE FROM ads WHERE id = ?");
        $ok = $stmt->execute([$id]);

        echo json_encode(["success" => $ok]);
    } else {
        echo json_encode(["error" => "Anuncio no encontrado"]);
    }
}
