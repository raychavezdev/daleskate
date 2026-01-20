<?php
require_once __DIR__ . "/../config/headers.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    try {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data["id"])) {
            throw new Exception("ID de encuesta no proporcionado");
        }

        $stmt = $conn->prepare("DELETE FROM polls WHERE id = :id");
        $stmt->execute([":id" => $data["id"]]);

        echo json_encode(["success" => true, "message" => "Encuesta eliminada correctamente"]);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
