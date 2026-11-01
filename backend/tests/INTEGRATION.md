# Integración local DaleSkate

Este fixture es exclusivamente para pruebas locales y **no representa el esquema de producción**. No se ha ejecutado su SQL ni se ha conectado a ninguna base durante su preparación. No apuntes estas instrucciones a Hostinger, a `daleskate.com` ni a otra base existente.

## Esquema observado e inferencias

Los nombres de tablas y columnas de la primera columna aparecen en consultas PHP. Los tipos de la segunda columna son decisiones del fixture cuando el código no los determina.

| Tabla | Columnas usadas por la API | Decisión del fixture / certeza |
|---|---|---|
| `users` | `id`, `username`, `role`, `password` | `id` autoincremental, `username` único y tipos `BIGINT`, `VARCHAR`, `VARCHAR`, `VARCHAR(255)` inferidos. El código confirma `password_verify()`/`password_hash()`, no el tipo SQL ni la unicidad productiva. |
| `articles` | `id`, `title`, `slug`, `tags`, `banner`, `banner_mobile`, `description`, `contenido`, `created_at`, `is_banner`, `is_exclusive`, `exclusive_token`, `status` | Los flags son numéricos al convertirse a entero; `contenido` se guarda como JSON serializado. El fixture usa `LONGTEXT` para contenido/HTML, `TINYINT` para flags, `DATETIME` con `CURRENT_TIMESTAMP`, token exclusivo único y `ENUM('draft','published')` con default publicado. Tipos, defaults e índices productivos no están disponibles. |
| `article_views` | `id`, `article_id` | El JOIN confirma la relación lógica con `articles.id`; el tipo de ID y la FK no están confirmados. El fixture usa FK con `ON DELETE CASCADE` solo para esta base de prueba. |
| `ads` | `id`, `image`, `link` | La API guarda un nombre de archivo y un enlace. El fixture infiere ID autoincremental, `VARCHAR` para imagen y `TEXT` para enlace; no hay timestamp usado en consultas. |
| `polls` | `id`, `question`, `options`, `votes`, `created_at`, `expires_at` | `options` y `votes` contienen JSON generado por PHP. El fixture usa `LONGTEXT` (portable entre MySQL/MariaDB), `DATETIME` para fechas y expiración nullable. El código no determina tipos SQL ni impone que la fecha se cumpla al votar. |

No se encontraron tablas separadas para opciones o votos. El endpoint de voto actualiza el JSON `votes`; los endpoints consultados no aplican un filtro de expiración al mostrar o registrar votos. El esquema fixture añade PK, índices y unicidad razonables para pruebas; no deben copiarse como restricciones de producción sin verificar el esquema real.

## Requisitos y salvaguardas

- Herramientas observadas en este equipo: PHP 8.5, Composer, MySQL Server local en TCP 3306, Node/npm y dependencias instaladas. MariaDB no está instalado aquí; la compatibilidad del fixture con MariaDB aún debe comprobarse en un servidor MariaDB si ese es el objetivo final.
- El seeder no carga `backend/.env`. Solo acepta `DALESKATE_TEST_DB_HOST`, `DALESKATE_TEST_DB_NAME`, `DALESKATE_TEST_DB_USER`, `DALESKATE_TEST_DB_PASS`, `DALESKATE_TEST_ADMIN_PASSWORD` y `DALESKATE_TEST_EDITOR_PASSWORD`.
- Antes de conectar, `integration_seed.php` exige host loopback y nombre exacto `daleskate_test`. Después verifica la base seleccionada, las tablas y que sus identificadores fixture no existan. Si ya encuentra datos, se detiene sin reemplazarlos.
- El seeder solo inserta dentro de una transacción y copia la imagen fixture si el destino exacto `backend/uploads/ads/integration-ad.svg` no existe. Nunca sobrescribe una imagen. No borra filas; si falla la transacción, revierte sus propios inserts y retira solo la copia creada por esa ejecución.
- `integration_schema.sql` contiene `USE daleskate_test` y `CREATE TABLE`, sin sentencias `DROP TABLE`, `DELETE FROM`, `TRUNCATE` ni `INSERT`. Declara una FK fixture `ON DELETE CASCADE` para visitas de artículos; no es una regla confirmada de producción. No ejecutes el SQL hasta verificar explícitamente el host local y que la base `daleskate_test` no exista todavía.
- La base debe crearse vacía y con credenciales dedicadas. No uses valores de `backend/.env`, credenciales de producción ni cuentas de la aplicación existentes.

## Crear la base y usuario de prueba

En PowerShell, desde la raíz del repositorio, conéctate explícitamente a la instancia local. `--password` solicita la contraseña sin incluirla en la línea de comandos:

```powershell
mysql --no-defaults --protocol=TCP --host=127.0.0.1 --port=3306 --user=TU_ADMIN_LOCAL --password
```

En el prompt de MySQL, comprueba la instancia y que el nombre no esté ocupado:

```sql
SELECT @@hostname, @@port, VERSION();
SELECT SCHEMA_NAME
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME = 'daleskate_test';
```

Confirma que es tu servidor local. La segunda consulta debe devolver cero filas. Si la base ya existe, **detente**; no la reutilices ni la limpies. Solo tras esas comprobaciones, crea la base y un usuario con privilegios limitados a ella. Sustituye el marcador por una contraseña nueva, local y exclusiva de pruebas:

```sql
CREATE DATABASE daleskate_test
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'daleskate_test_user'@'127.0.0.1'
  IDENTIFIED BY '<REEMPLAZAR_POR_PASSWORD_LOCAL_DE_PRUEBA>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX, REFERENCES
  ON daleskate_test.* TO 'daleskate_test_user'@'127.0.0.1';
```

No se otorga `DROP`, `FILE`, `SUPER` ni privilegios globales. Luego conecta con el usuario de prueba y vuelve a comprobar host y base antes de aplicar el fixture:

```powershell
mysql --no-defaults --protocol=TCP --host=127.0.0.1 --port=3306 --user=daleskate_test_user --password --database=daleskate_test
```

```sql
SELECT @@hostname, @@port, DATABASE();
SOURCE backend/tests/fixtures/integration_schema.sql;
```

Ejecuta `SOURCE` únicamente si `DATABASE()` es exactamente `daleskate_test` y `@@hostname` corresponde a este equipo. No hay instrucciones de reset automático: no borres tablas ni filas para repetir el proceso; si el fixture ya existe, revisa la base manualmente y solicita autorización antes de limpiar algo.

## Insertar datos ficticios

En una sesión PowerShell nueva, configura las variables de esta base dedicada. Las contraseñas se solicitan de forma oculta; no reutilices contraseñas reales ni compartas estos valores:

```powershell
$env:DALESKATE_TEST_DB_HOST = '127.0.0.1'
$env:DALESKATE_TEST_DB_NAME = 'daleskate_test'
$env:DALESKATE_TEST_DB_USER = 'daleskate_test_user'
$secure = Read-Host 'Contraseña de la cuenta MySQL local de pruebas' -AsSecureString
$env:DALESKATE_TEST_DB_PASS = [System.Net.NetworkCredential]::new('', $secure).Password
Remove-Variable secure
$secure = Read-Host 'Contraseña ficticia para integration-admin' -AsSecureString
$env:DALESKATE_TEST_ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $secure).Password
Remove-Variable secure
$secure = Read-Host 'Contraseña ficticia para integration-editor' -AsSecureString
$env:DALESKATE_TEST_EDITOR_PASSWORD = [System.Net.NetworkCredential]::new('', $secure).Password
Remove-Variable secure
php backend/tests/fixtures/integration_seed.php
```

El seed crea dos usuarios ficticios (`integration-admin` con rol `admin` e `integration-editor` con rol `editor`), un artículo público, uno exclusivo con token compartible ficticio, un borrador incompleto, un anuncio con imagen de prueba, una encuesta con dos opciones y dos visitas del artículo público. Las contraseñas se almacenan como bcrypt. No imprime contraseñas, hashes ni tokens.

## Iniciar PHP y Vite sin tocar `.env`

En otra terminal PowerShell, configura explícitamente **todas** las variables del backend para que el servidor local use solo la base aislada. No edites `backend/.env`:

```powershell
$env:DB_HOST = '127.0.0.1'
$env:DB_NAME = 'daleskate_test'
$env:DB_USER = 'daleskate_test_user'
$env:DB_PASS = $env:DALESKATE_TEST_DB_PASS
$env:SECRET_KEY = '<CLAVE_FICTICIA_LARGA_SOLO_PARA_ESTA_PRUEBA>'
$env:FRONTEND_URL = 'http://127.0.0.1:5173'
$env:APP_ENV = 'production'
php -S 127.0.0.1:8000 -t backend
```

Sustituye el marcador de `SECRET_KEY` por una clave de prueba local; nunca uses la clave de Hostinger. Deja esa terminal abierta. En otra terminal inicia Vite con URL de API local explícita, sin modificar archivos de entorno:

```powershell
Set-Location frontend
$env:VITE_API_URL = 'http://127.0.0.1:8000'
npm.cmd run dev -- --host 127.0.0.1
```

La interfaz quedará disponible en `http://127.0.0.1:5173`. Comprueba en la consola del navegador que la API apunta a `127.0.0.1:8000` antes de iniciar sesión. No copies ni imprimas tokens desde `localStorage` o DevTools.

## Plan de pruebas HTTP y navegador

Usa solo `integration-admin`, `integration-editor` y los registros creados por el seeder. Guarda tokens en variables locales; no los escribas en consola ni capturas.

| Flujo | Solicitud/acción | Resultado esperado |
|---|---|---|
| Login | `POST /api/auth.php` con el admin ficticio; repetir con contraseña incorrecta | Login correcto devuelve token; credencial incorrecta devuelve 401 sin token. El token debe llevar `iat` y `exp`. |
| JWT/rol | `GET /api/poll_list.php` sin token, con token admin y con token de `integration-editor` | 401, respuesta administrativa válida, y 403 respectivamente. El 403 no debe borrar la sesión frontend. |
| Token expirado | Firmar un JWT ficticio ya vencido con la `SECRET_KEY` local y enviarlo a una operación protegida | 401. La suite PHP ya prueba este caso con clave ficticia; la comprobación HTTP debe usar solo la clave local de prueba. |
| Artículos públicos | `GET /api/article_list.php`; obtener el ID del slug `integration-public-article`; `GET /api/article_get.php?id=<id>` sin token | Ambos accesibles sin autenticación; la lista no debe incluir el artículo exclusivo. |
| Exclusivos | Obtener el ID de `integration-exclusive-article`; probar consulta por ID sin token, con admin y con `token=integration-share-token-only` | Por ID sin token: 401; con admin: 200; por enlace compartible: 200 sin volver a incluir `exclusive_token`. |
| CRUD de artículos | Desde `/admin/articles`, crear un artículo ficticio sin archivos, editarlo y eliminar únicamente ese artículo de prueba | Las operaciones autenticadas funcionan; la lista pública lo refleja y deja de mostrarlo tras borrarlo. No borres los artículos seed para probar. |
| Borradores | En `/admin/articles`, crear un borrador incompleto, volver a editarlo, completar y publicar; devolver otro artículo a borrador con confirmación | La lista administrativa requiere admin y filtra todos/publicados/borradores. La lista pública, banners, videos, visitas y enlaces compartibles no deben exponer los borradores. Para publicar, título y tags deben estar completos; si es banner, debe tener una portada. |
| Anuncios | `GET /api/ads_get.php`; usar `/admin/ads` para subir la imagen fixture y eliminar solo el anuncio creado para esa prueba | Consulta pública funciona; creación/eliminación con admin funcionan; `ads_create.php` sin JWT devuelve 401 y no crea archivo ni fila. La eliminación del anuncio seed retira su imagen fixture; vuelve a seedear solo en una base nueva y vacía. |
| Encuestas | `GET /api/poll_get_active.php`; votar por una opción seed; usar `/admin/polls/create` y `/admin/polls` para crear, listar y eliminar una encuesta ficticia | Lectura/voto públicos funcionan; operaciones administrativas requieren admin. Sin JWT, `poll_create.php`, `poll_delete.php` y `poll_list.php` devuelven 401. |
| Estadísticas | `GET /api/article_stats.php` con admin y luego sin token/con editor | Admin recibe estadísticas con visitas; ausente recibe 401; editor recibe 403. El seed crea dos visitas ficticias. |
| Sesión React | En `http://127.0.0.1:5173/login`, iniciar sesión como admin, navegar por artículos/anuncios/encuestas/estadísticas y cerrar sesión | El panel carga, logout borra la sesión y vuelve al login. Repetir como editor y comprobar mensajes 403 sin redirección de sesión. |

`article_create.php`/`article_edit.php` usan `multipart/form-data`; `ads_create.php` requiere una imagen y un enlace. Las operaciones CRUD de esta tabla están descritas para la interfaz o una herramienta HTTP apuntada exclusivamente a la API local; no se ejecutan al cargar el esquema ni al correr el seed.

## Migración de artículos a estados

El archivo `backend/migrations/20261031_add_article_status.sql` es una migración manual para el esquema de aplicación; no la ejecuta el seed ni forma parte de `integration_schema.sql`. El orden previsto es: respaldar y verificar el esquema real del entorno destino; aplicar la migración una sola vez; desplegar primero los endpoints PHP que filtran y guardan `status`; después publicar el build React que usa el listado administrativo y envía el estado. Para Hostinger, comparar antes el tipo/default de columnas existentes y confirmar respaldo/ventana con el operador. No se ha comprobado ni ejecutado esta migración en producción.

## Limpieza y límites

No se proporciona limpieza automática. No uses `DROP`, `DELETE`, `TRUNCATE` ni limpiezas generales. Si se necesita retirar fixtures al terminar, identifica cada fila/archivo creado por estas pruebas y solicita autorización antes de borrarlo. El endpoint de artículos puede dejar directorios vacíos de uploads y la eliminación de artículos no se debe asumir como limpieza de archivos.

El fixture valida integración sobre este esquema aproximado, no garantiza equivalencia con producción. Antes de desplegar, comparar las necesidades funcionales con un esquema documentado de producción sin copiar sus registros ni credenciales.
