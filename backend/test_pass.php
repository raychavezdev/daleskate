<?php
$password = "admindaleskate2025";
$hash = password_hash($password, PASSWORD_DEFAULT);
echo $hash;
