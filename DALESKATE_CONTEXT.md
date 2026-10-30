# Contexto técnico y funcional de DaleSkate

Documento vivo basado en el código y manifiestos disponibles en el repositorio. Lo que no se puede comprobar localmente se indica como pendiente.

## Propósito y arquitectura

DaleSkate es una plataforma para una revista digital de skateboarding. El repositorio separa la interfaz pública y administrativa en `frontend/` (SPA React) y una API JSON en `backend/` (scripts PHP). PHP conecta por PDO a MySQL; el frontend consulta esa API mediante `VITE_API_URL`. No se encontró esquema SQL ni definición versionada de tablas.

## Stack y versiones verificables

- Frontend: React y React DOM 19.1.1; Vite 7.1.2; React Router DOM 7.8.2; Tailwind CSS y su plugin Vite 4.1.12; React Quill New 3.6.0; DOMPurify 3.2.6. Versiones resueltas del `frontend/package-lock.json`.
- Herramientas frontend declaradas: ESLint 9.33.0, plugin React SWC para Vite 4.0.0.
- Backend: PHP; `composer.json` requiere `firebase/php-jwt` `^6.11` y `vlucas/phpdotenv` `^5.6`; el lock fija JWT 6.11.1. No hay versión de PHP fijada en el repositorio (JWT declara PHP `^8.0`).
- En esta máquina se observaron Node 24.19.0, npm 11.17.0, PHP 8.5.9 y Composer 2.10.2; son versiones locales, no requisitos fijados por el proyecto.

## Mapa del repositorio

- `frontend/src/App.jsx`: rutas públicas, layout y rutas administrativas protegidas en cliente.
- `frontend/src/components/main/`: listado y detalle de artículos.
- `frontend/src/components/admin/`: editor y gestión de artículos, anuncios, encuestas, estadísticas y contraseña.
- `frontend/src/components/ads/`: carrusel publicitario y widget de encuesta.
- `frontend/src/components/pages/`: login, videos, explorar, tienda y RedMX.
- `frontend/public/`: recursos estáticos y `_redirects`.
- `backend/api/`: endpoints PHP por módulo; `backend/config/`: carga de entorno, conexión y cabeceras CORS.
- `backend/uploads/` es una ruta de almacenamiento usada por el código; no forma parte de los archivos listados del repositorio.

## Funcionalidades observadas

- Artículos: listado público, artículo destacado, detalle por ID y artículos exclusivos mediante token; edición/creación con título, slug, tags, descripción enriquecida, bloques de contenido y registro/estadísticas de visitas.
- Portadas: el editor admite portada (`banner`) y portada móvil (`banner_mobile`) opcionales. Para marcar artículo como banner de inicio exige al menos una de las dos. El detalle prefiere portada de escritorio en pantallas medianas o mayores y la móvil en pantallas pequeñas, usando la otra como respaldo. En tarjetas/listados observados se elige `banner` y, si falta, `banner_mobile`.
- Miniaturas de YouTube: `RecentArticles.jsx` deriva una imagen de YouTube de bloques de video para representar artículos sin una portada normal; `Article.jsx` muestra un indicador de reproducción si la URL de imagen contiene `img.youtube.com`. El contenido `video` se incrusta como reproductor en el detalle; `video_externo` muestra su imagen `preview` opcional y un enlace externo. No se encontró regla que convierta esas miniaturas en las portadas `banner`/`banner_mobile` guardadas. Verificar comportamiento en casos concretos antes de cambiarlo.
- Administración: dashboard y secciones para artículos, exclusivos, anuncios, encuestas, cambio de contraseña y estadísticas.
- Publicidad: alta/listado/eliminación de anuncios y carrusel en la interfaz.
- Encuestas: crear con pregunta, opciones y fecha de expiración opcional; listar/eliminar, mostrar última encuesta y registrar votos. La interfaz guarda en `localStorage` una lista local de encuestas votadas.
- Otras vistas públicas presentes: Videos, Explorar, Tienda y RedMX. Su disponibilidad no prueba que tengan integración de backend completa.

## Comunicación, datos y configuración

El frontend forma URLs como `${VITE_API_URL}/api/<archivo>.php`. Los endpoints usan `config/headers.php`, que carga la conexión y configura JSON y CORS para un único origen `FRONTEND_URL` (por defecto local en el código), permite credenciales y los métodos GET, POST, OPTIONS y DELETE. El acceso a datos utiliza PDO/MySQL y consultas preparadas en varias operaciones. Las consultas identifican `articles`, `article_views`, `ads`, `polls` y `users`; sus columnas productivas, tipos e índices no se pueden confirmar porque no hay esquema de producción versionado. `backend/tests/fixtures/integration_schema.sql` es solo un esquema aproximado para la base aislada `daleskate_test`, no una migración ni una copia de producción. Las instrucciones locales están en `backend/tests/INTEGRATION.md`.

Variables leídas por el código (documentadas solo por nombre y función):

- Frontend: `VITE_API_URL`, URL base de la API.
- Backend: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` para PDO; `SECRET_KEY` para JWT; `FRONTEND_URL` para CORS; `APP_ENV` para nivel de errores; `UPLOADS_DIR` establece el nombre de ruta predeterminado, aunque las operaciones inspeccionadas usan rutas `uploads/...` explícitas.

El backend carga `backend/.env` con phpdotenv y permite que falte para las rutas que no necesitan autenticación. Las rutas JWT requieren `SECRET_KEY` no vacía y fallan con un error genérico si falta. Hay archivos `.env` locales/protegidos: no leer, copiar ni documentar sus valores. El repositorio no proporciona valores de ejemplo seguros ni guía local completa. Frontend: desde `frontend/`, `npm install`, `npm run dev`; el valor de `VITE_API_URL` debe apuntar a una API disponible. Las dependencias de PHP se instalan con Composer según el manifiesto; se requiere `backend/vendor/autoload.php`. Confirmar instrucciones exactas y disponibilidad de servicios en cada entorno.

Scripts declarados en `frontend/package.json`: `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`. No se encontraron scripts de test. No hay scripts Composer. PHP CLI y Composer estaban disponibles en esta máquina; npm debe invocarse como `npm` o `npm.cmd` según la política de PowerShell.

## Seguridad y archivos

- El login valida contraseñas con `password_verify()` y entrega un JWT HS256 con `iat` y `exp`, con duración de ocho horas. La validación compartida rechaza firmas inválidas, tokens vencidos y tokens sin `exp`.
- Las operaciones administrativas de artículos, anuncios, encuestas y estadísticas requieren JWT y rol `admin`; la autorización compara también el rol actual en MySQL. Los artículos normales y los enlaces exclusivos compartibles conservan sus rutas públicas.
- Las rutas privadas de React comprueban la expiración para evitar mostrar el panel con un token vencido; la API sigue siendo la autoridad de autenticación y autorización.
- `SECRET_KEY` es obligatoria para las rutas JWT y se obtiene del entorno del backend. Si falta o está vacía, esas rutas responden con error genérico; las rutas públicas que no usan JWT no dependen de ella. No hay fallback de clave en `db.php`.
- Los auxiliares `backend/test_pass.php` y `backend/config/test_db.php` se retiraron del repositorio; verificar y retirar cualquier copia que pudiera permanecer en el despliegue de Hostinger.
- Cambiar la contraseña no revoca inmediatamente JWT emitidos. Esos tokens continúan válidos hasta su expiración, como máximo ocho horas después de emitidos.
- El detalle de artículo sanea HTML de descripción y bloques de texto con DOMPurify. Las subidas de imágenes de bloques/miniaturas validan extensión jpg/jpeg/png/gif; las subidas de portadas/anuncios observadas no aplican validación equivalente en estos scripts. `move_uploaded_file` y directorios `uploads/banners`, `uploads/articles/<id>` y `uploads/ads` requieren permisos de escritura y reglas de acceso apropiadas.
- CORS depende del origen configurado; no usar comodines implícitos ni exponer secretos en el frontend.

## Despliegue y pendientes

La compatibilidad deseada es el despliegue existente en Hostinger, pero no hay documentación, configuración de hosting, workflow o scripts de despliegue en los archivos inspeccionados. El repositorio por sí solo no confirma cómo se publica el build, dónde se sirve PHP, cómo se configura MySQL, qué estructura de carpetas se sube ni qué versión/extensiones PHP ofrece el hosting. Confirmar estos datos antes de modificar el proceso. `frontend/public/_redirects` existe, pero no demuestra que Hostinger lo use.

Pendiente de confirmar: esquema y migraciones de base de datos; configuración real de variables, PHP, CORS/HTTPS, rutas y permisos en Hostinger; protección de archivos internos y retirada de copias antiguas de los auxiliares; revocación inmediata de sesiones tras cambiar contraseña; validación/límites/MIME y protección contra ejecución de archivos subidos; si expiración de encuestas se aplica al votar/mostrar; contenido e integración completos de las páginas secundarias. No inferir estos comportamientos a partir de sus nombres.
