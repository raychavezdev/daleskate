<?php

require_once __DIR__ . "/../config/headers.php";

try {
    $excludeBanner =
        isset($_GET["exclude_banner"]) &&
        $_GET["exclude_banner"] == 1;

    $query = "
        SELECT
            id,
            slug,
            title,
            banner,
            banner_mobile,
            tags,
            description,
            contenido,
            created_at,
            is_banner
        FROM articles
        WHERE is_exclusive = 0
    ";

    if ($excludeBanner) {
        $query .= " AND is_banner = 0";
    }

    $query .= " ORDER BY created_at DESC";

    $stmt = $conn->prepare($query);
    $stmt->execute();

    $articulos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    /*
     * Convertimos algunos valores para que el frontend reciba
     * tipos consistentes.
     */
    foreach ($articulos as &$articulo) {
        $articulo["id"] = (int) $articulo["id"];
        $articulo["is_banner"] = (int) $articulo["is_banner"];

        /*
         * Si no hay portada, enviamos null en lugar de una
         * cadena vacía.
         */
        $articulo["banner"] =
            !empty($articulo["banner"])
                ? $articulo["banner"]
                : null;

        $articulo["banner_mobile"] =
            !empty($articulo["banner_mobile"])
                ? $articulo["banner_mobile"]
                : null;

        /*
         * contenido se conserva como JSON.
         * RecentArticles.jsx se encargará de interpretarlo.
         */
        $articulo["contenido"] =
            !empty($articulo["contenido"])
                ? $articulo["contenido"]
                : "[]";
    }

    unset($articulo);

    echo json_encode(
        $articulos,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );
} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        "error" => "Error al obtener artículos",
        "detail" => $e->getMessage(),
    ]);
}