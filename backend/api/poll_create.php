<?php
require_once __DIR__ . "/../config/headers.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    try {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data["question"]) || !isset($data["options"]) || !is_array($data["options"]) || count($data["options"]) < 2) {
            throw new Exception("Pregunta u opciones inválidas");
        }

        $question = $data["question"];
        $options = $data["options"];
        $expires_at = $data["expires_at"] ?? null;

        // Convertir opciones y votos a JSON
        $options_json = json_encode($options);
        $votes_json = json_encode(array_fill_keys($options, 0));

        // Insertar en la DB
        $stmt = $conn->prepare("INSERT INTO polls (question, options, votes, expires_at) VALUES (:question, :options, :votes, :expires_at)");
        $stmt->execute([
            ":question" => $question,
            ":options" => $options_json,
            ":votes" => $votes_json,
            ":expires_at" => $expires_at
        ]);

        echo json_encode(["success" => true, "message" => "Encuesta creada correctamente", "poll_id" => $conn->lastInsertId()]);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
