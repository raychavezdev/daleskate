<?php
$host = "localhost";        // o la IP de tu servidor
$db_name = "daleskate";     // nombre de tu base de datos
$username = "root";         // tu usuario de MySQL
$password = "";             // tu contraseña de MySQL


// Clave secreta para JWT
define("SECRET_KEY", "mi_clave_ultra_secreta_2025");

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password);
    // Manejo de errores
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Devuelve arrays asociativos por default
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión: " . $e->getMessage()]);
    exit;
}