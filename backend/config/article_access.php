<?php

function getArticleById(PDO $conn, $id, bool $includeExclusive = false, bool $includeDrafts = false): ?array
{
    $query = "
        SELECT id, title, slug, tags, banner, banner_mobile, description,
               contenido, created_at, is_banner, is_exclusive, status
        FROM articles
        WHERE id = :id
    ";

    if (!$includeExclusive) {
        $query .= " AND is_exclusive = 0";
    }
    if (!$includeDrafts) {
        $query .= " AND status = 'published'";
    }

    $stmt = $conn->prepare($query);
    $stmt->execute([":id" => $id]);
    $article = $stmt->fetch(PDO::FETCH_ASSOC);

    return $article ?: null;
}

function getExclusiveArticleByShareToken(PDO $conn, string $token): ?array
{
    $stmt = $conn->prepare(
        "SELECT id, title, slug, tags, banner, banner_mobile, description,
                contenido, created_at, is_banner, is_exclusive
         FROM articles
         WHERE exclusive_token = :token AND is_exclusive = 1 AND status = 'published'"
    );
    $stmt->execute([":token" => $token]);
    $article = $stmt->fetch(PDO::FETCH_ASSOC);

    return $article ?: null;
}

function getExclusiveArticles(PDO $conn, ?object $claims): ?array
{
    if ($claims === null) {
        return null;
    }

    $stmt = $conn->prepare(
        "SELECT id, title, slug, exclusive_token, created_at
         FROM articles
         WHERE is_exclusive = 1 AND status = 'published'
         ORDER BY created_at DESC"
    );
    $stmt->execute();

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getPublicBannerArticle(PDO $conn): ?array
{
    $stmt = $conn->prepare(
        "SELECT id, title, tags, banner, banner_mobile, description
         FROM articles
         WHERE is_banner = 1 AND is_exclusive = 0 AND status = 'published'
         LIMIT 1"
    );
    $stmt->execute();
    $article = $stmt->fetch(PDO::FETCH_ASSOC);

    return $article ?: null;
}
