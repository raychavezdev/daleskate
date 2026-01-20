<?php
require_once __DIR__ . "/../config/headers.php";

try {
    $stmt = $conn->query("SELECT * FROM polls ORDER BY created_at DESC LIMIT 1");
    $poll = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$poll) {
        echo json_encode(["success" => false, "message" => "No hay encuestas activas"]);
        exit;
    }

    $poll["options"] = json_decode($poll["options"], true);
    $poll["votes"] = json_decode($poll["votes"], true);

    echo json_encode(["success" => true, "poll" => $poll]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["error" => $e->getMessage()]);
}
