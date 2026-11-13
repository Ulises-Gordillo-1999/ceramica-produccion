<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas del Proyecto CERÁMICA PRODUCCIÓN

- **Contexto del Proyecto**: Consulta `.agents/rules/project-context.md`.
- **Arquitectura de Base de Datos en Coolify**: Consulta `.agents/rules/hetzner-coolify-postgres-architecture.md` (conectar al cluster compartido `postgres-cluster` mediante base de datos lógica `ceramica_prod_db`, nunca instanciar un contenedor PostgreSQL nuevo).
- **Seguridad**: Respetar `.agents/skills/env-security-protocol/SKILL.md` (cero contraseñas o secretos en código fuente).

