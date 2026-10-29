# Instrucciones para Codex

- Antes de cambiar algo, entiende el código relacionado con la solicitud y consulta `DALESKATE_CONTEXT.md` para contexto arquitectónico, funcional o de despliegue.
- Sigue las convenciones y arquitectura existentes; limita cada cambio a lo necesario y fácil de revisar.
- Evita refactorizaciones, migraciones y cambios de dependencias innecesarios. Conserva compatibilidad con el despliegue actual en Hostinger.
- Usa npm para el frontend; no uses pnpm. En el entorno local asume Windows, herramientas portables y ausencia de permisos de administrador; no agregues herramientas que requieran instalación administrativa sin necesidad o autorización.
- Escribe los mensajes de commit en español con formato Conventional Commits. No hagas commits, push ni despliegues sin autorización explícita.
- No modifiques ni expongas credenciales, secretos o archivos `.env`. No incluyas sus valores en documentación o salidas.
- Valida los cambios con los scripts y herramientas que realmente existan en el repositorio; no supongas comandos disponibles.
- Al informar el resultado, explica qué archivos cambiaron, por qué y qué validaciones ejecutaste.
