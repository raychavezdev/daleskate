-- Migración de aplicación para la tabla articles.
-- Revisar contra el esquema real del entorno antes de ejecutar. No forma parte
-- del fixture de integración y no debe ejecutarse automáticamente.
ALTER TABLE articles
    ADD COLUMN status ENUM('draft', 'published') NOT NULL DEFAULT 'published';
