<?php

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../../config/authentication.php';

$db = new PDO('sqlite::memory:');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, role TEXT, password TEXT)');

$password = 'Fictional-Session-Test-Only';
$hash = password_hash($password, PASSWORD_BCRYPT);
$insert = $db->prepare('INSERT INTO users (id, username, role, password) VALUES (?, ?, ?, ?)');
$insert->execute([1, 'frontend-compatibility-test', 'admin', $hash]);

[$status, $response] = authenticateRequest(
    $db,
    (object)['username' => 'frontend-compatibility-test', 'password' => $password],
    'frontend-compatibility-test-secret'
);

if ($status !== 200 || empty($response['token'])) {
    fwrite(STDERR, 'No fue posible emitir el JWT ficticio de compatibilidad.');
    exit(1);
}

echo $response['token'];
