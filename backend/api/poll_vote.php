<?php
require_once __DIR__ . "/../config/headers.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        $pollId = $data["poll_id"] ?? null;
        $option = $data["option"] ?? null;

        if (!$pollId || !$option) {
            throw new Exception("Datos incompletos");
        }

        // Obtener encuesta actual
        $stmt = $conn->prepare("SELECT votes FROM polls WHERE id = :id");
        $stmt->execute([":id" => $pollId]);
        $poll = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$poll) {
            throw new Exception("Encuesta no encontrada");
        }

        $votes = json_decode($poll["votes"], true);
        if (!isset($votes[$option])) {
            $votes[$option] = 0;
        }

        $votes[$option]++;

        $stmt = $conn->prepare("UPDATE polls SET votes = :votes WHERE id = :id");
        $stmt->execute([
            ":votes" => json_encode($votes),
            ":id" => $pollId
        ]);

        echo json_encode(["success" => true, "message" => "Voto registrado"]);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
