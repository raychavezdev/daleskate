-- Esquema aproximado EXCLUSIVO para integración local de DaleSkate.
-- No es una migración ni una copia del esquema de producción.
-- Ejecutar solo después de verificar host local y base daleskate_test vacía.

USE daleskate_test;

CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL,
    role VARCHAR(32) NOT NULL,
    password VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE articles (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    tags TEXT NOT NULL,
    banner VARCHAR(512) NULL,
    banner_mobile VARCHAR(512) NULL,
    description LONGTEXT NOT NULL,
    contenido LONGTEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_banner TINYINT UNSIGNED NOT NULL DEFAULT 0,
    is_exclusive TINYINT UNSIGNED NOT NULL DEFAULT 0,
    exclusive_token VARCHAR(128) NULL,
    status ENUM('draft', 'published') NOT NULL DEFAULT 'published',
    PRIMARY KEY (id),
    UNIQUE KEY uq_articles_exclusive_token (exclusive_token),
    KEY idx_articles_created_at (created_at),
    KEY idx_articles_public_banner (is_banner, is_exclusive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE article_views (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    article_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    KEY idx_article_views_article_id (article_id),
    CONSTRAINT fk_article_views_article
        FOREIGN KEY (article_id) REFERENCES articles (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ads (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    image VARCHAR(255) NOT NULL,
    link TEXT NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE polls (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    question TEXT NOT NULL,
    options LONGTEXT NOT NULL,
    votes LONGTEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_polls_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
