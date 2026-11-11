# Contexto Arquitectónico del Proyecto: CERÁMICA PRODUCCIÓN

## 1. Dominio del Negocio
Sistema industrial de control y trazabilidad de producción cerámica por turnos (**Mañana**, **Tarde** y **Noche**). Digitaliza la planilla de planta en **5 etapas secuenciales**:
1. **Extrusora** (Cantidad de bancos y tipo de ladrillo).
2. **Secadero** (Cantidad de bancos y tipo de ladrillo).
3. **Carga de Banco** (Manual vs. Robot y tipo de ladrillo).
4. **Horno** (Zorras cargadas vs. Zorras fuera y tipo de ladrillo).
5. **Descarga** (Cantidad de zorras y tipo de ladrillo).
Además registra **Salida de Material (Toneladas)**, **Consumo de Gas por Turno** y **Viajes de Tierra (Negra y Roja)**.

## 2. Stack Tecnológico
- **Framework:** Next.js 16+ (App Router, `output: 'standalone'`), React 19, TypeScript 5 estricto.
- **Base de Datos:** PostgreSQL 16 (Docker local en puerto `5435`, administrado en Coolify en producción) + Drizzle ORM (`src/db/schema.ts`).
- **Estilos y Temas:** Tailwind CSS v4 con soporte Claro / Oscuro / Sistema sin parpadeo (`ThemeProvider` + script inline en `src/app/layout.tsx`).
- **Ergonomía Móvil y PWA:** Diseño Mobile-First (`responsive-design`), instalable como PWA (`public/manifest.webmanifest`) y autenticación con Huella Digital / FaceID vía WebAuthn (`src/utils/biometrics.ts`).
- **Seguridad RBAC:** Roles `ADMIN`, `DIRECTORIO`, `INGENIERO_ENCARGADO` y `CAPATAZ` protegidos por JWT (`jose`) en cookies `HttpOnly`.
