<?php
// 🔹 Cargar bootstrap (dotenv y configuración de entorno)
require_once __DIR__ . '/bootstrap.php';

// Obtener datos de conexión desde .env con valores por defecto
$host = $_ENV['DB_HOST'] ?? 'localhost';
$db_name = $_ENV['DB_NAME'] ?? 'daleskate';
$username = $_ENV['DB_USER'] ?? 'root';
$password = $_ENV['DB_PASS'] ?? '';

// Clave secreta para JWT
define("SECRET_KEY", $_ENV['SECRET_KEY'] ?? 'mi_clave_ultra_secreta_2025');

try {
    $conn = new PDO(
        "mysql:host=$host;dbname=$db_name;charset=utf8mb4",
        $username,
        $password
    );
    // Manejo de errores
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Devuelve arrays asociativos por default
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión: " . $e->getMessage()]);
    exit;
}