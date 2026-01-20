<?php
require_once __DIR__ . "/../config/headers.php";

try {
    $stmt = $conn->query("SELECT id, question, options, votes, created_at, expires_at FROM polls ORDER BY created_at DESC");
    $polls = [];

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $row['options'] = json_decode($row['options'], true);
        $row['votes'] = json_decode($row['votes'], true);
        $polls[] = $row;
    }

    echo json_encode(["success" => true, "polls" => $polls]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["error" => $e->getMessage()]);
}
