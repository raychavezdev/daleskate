<?php

function normalizeArticleStatus($status, string $fallback = 'published'): ?string
{
    if ($status === null || $status === '') {
        return $fallback;
    }

    return in_array($status, ['draft', 'published'], true) ? $status : null;
}

function createArticleSlug(string $title): string
{
    $slug = strtolower($title);
    $transliterated = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $slug);
    if ($transliterated !== false) {
        $slug = $transliterated;
    }

    $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
    $slug = preg_replace('/[\s-]+/', '-', $slug);

    return trim($slug, '-');
}

function createUniqueArticleSlug(PDO $conn, string $title, ?int $excludeId = null): string
{
    $base = createArticleSlug($title);
    if ($base === '') {
        $base = 'borrador-' . bin2hex(random_bytes(6));
    }

    $candidate = $base;
    $suffix = 2;
    do {
        $query = 'SELECT id FROM articles WHERE slug = :slug';
        if ($excludeId !== null) {
            $query .= ' AND id <> :id';
        }
        $query .= ' LIMIT 1';
        $stmt = $conn->prepare($query);
        $params = [':slug' => $candidate];
        if ($excludeId !== null) {
            $params[':id'] = $excludeId;
        }
        $stmt->execute($params);
        if (!$stmt->fetchColumn()) {
            return $candidate;
        }

        $candidate = $base . '-' . $suffix++;
    } while (true);
}

function articlePublicationErrors(array $article, bool $hasBannerUpload = false, bool $hasMobileBannerUpload = false): array
{
    $errors = [];
    if (trim((string)($article['title'] ?? '')) === '') {
        $errors[] = 'El título es obligatorio.';
    } elseif (createArticleSlug((string)$article['title']) === '') {
        $errors[] = 'El título debe incluir letras o números.';
    }
    if (trim((string)($article['tags'] ?? '')) === '') {
        $errors[] = 'Los tags son obligatorios.';
    }

    $hasBanner = $hasBannerUpload || $hasMobileBannerUpload
        || !empty($article['banner']) || !empty($article['banner_mobile']);
    if (!empty($article['is_banner']) && !$hasBanner) {
        $errors[] = 'Agrega una portada para mostrar el artículo como banner.';
    }

    return $errors;
}
