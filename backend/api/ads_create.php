<?php
require_once __DIR__ . "/../config/headers.php";
require_once __DIR__ . "/../config/authentication.php";

$claims = validateBearerToken(getAuthorizationHeader(), $_ENV["SECRET_KEY"]);
if ($claims === null) {
    http_response_code(401);
    echo json_encode(["error" => "Token no proporcionado o inválido"]);
    exit;
}

$uploadDir = __DIR__ . "/../uploads/ads/";

if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    try {
        if (!isset($_FILES["image"]) || !isset($_POST["link"])) {
            throw new Exception("Faltan campos obligatorios.");
        }

        $link = $_POST["link"];
        $file = $_FILES["image"];
        $fileName = time() . "_" . basename($file["name"]);
        $filePath = $uploadDir . $fileName;

        if (move_uploaded_file($file["tmp_name"], $filePath)) {
            $stmt = $conn->prepare("INSERT INTO ads (image, link) VALUES (:image, :link)");
            $stmt->execute([
                ":image" => $fileName,
                ":link" => $link
            ]);

            echo json_encode(["success" => true, "message" => "Anuncio creado correctamente"]);
        } else {
            throw new Exception("No se pudo subir la imagen.");
        }
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
