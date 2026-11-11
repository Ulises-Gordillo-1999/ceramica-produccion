# CERÁMICA PRODUCCIÓN ERP — Sistema de Control de Planta

Sistema integral web/PWA para el control operativo de producción cerámica por turnos (**Mañana**, **Tarde** y **Noche**), monitoreo en tiempo real para dirección e ingeniería, comparativas históricas y reportes PDF.

---

## 🚀 Stack Tecnológico

- **Framework:** Next.js 16 (App Router, `output: 'standalone'`), React 19, TypeScript 5
- **Base de Datos:** PostgreSQL 16 + Drizzle ORM (`src/db/schema.ts`)
- **Estilos y Temas:** Tailwind CSS v4 con soporte Claro / Oscuro / Sistema sin destello (anti-flicker)
- **Móvil y Seguridad:** PWA instalable + Autenticación biométrica con Huella Digital / FaceID (WebAuthn) y RBAC con JWT (`jose` + `bcryptjs`)
- **Reportes:** Exportación PDF nativa con `jspdf` + `jspdf-autotable`

---

## 📦 Módulos del Sistema

1. **Planilla de Turno Móvil (`/capataz`):**
   - Carga rápida por etapa: **Extrusora** (bancos + ladrillo), **Secadero** (bancos + ladrillo), **Carga de Banco** (Manual / Robot + ladrillo), **Horno** (Zorras cargadas / Zorras fuera + ladrillo) y **Descarga** (zorras + ladrillo).
   - Registro de **Salida de Material (Toneladas)**, **Consumo de Gas (Turno Mañana / Tarde / Noche)** y **Viajes de Tierra (Negra / Roja)**.
   - Soporte para múltiples tipos de ladrillo por etapa cuando hay cambio de molde en el turno.
   - Guardado parcial en vivo (`EN_CURSO`) y cierre formal de turno (`CERRADO`).
2. **Dashboard en Tiempo Real (`/dashboard`):**
   - Sincronización automática en vivo de los 3 turnos del día.
   - Navegador temporal (*Time-Travel*) día por día y tira rápida de fechas recientes.
   - Auditoría y reapertura de turnos para Encargados/Ingenieros y descarga de PDF diario.
3. **Estadísticas, Comparativas y Reportes (`/estadisticas`):**
   - Comparador directo **Día A vs. Día B** etapa por etapa.
   - KPIs de rendimiento térmico ($\text{m}^3$ de gas por zorra y por tonelada cocida) y automatización (Robot vs. Manual).
4. **Catálogo de Ladrillos (`/catalogo`):**
   - Gestión de modelos (`H8`, `H12`, `H18`, `P12`, `P18`, `BOV`, etc.) con factores de conversión a unidades por banco, unidades por zorra y peso en kg.
5. **Usuarios, Roles RBAC y Biometría (`/usuarios`):**
   - Roles `CAPATAZ`, `INGENIERO_ENCARGADO`, `DIRECTORIO` y `ADMIN`.
   - Vinculación de Huella Digital (WebAuthn Passkeys) desde el menú lateral.

---

## 🛠️ Configuración en Desarrollo Local

1. Copiar `.env.example` a `.env.local` y configurar placeholders locales:
   ```env
   POSTGRES_USER=ceramica_admin
   POSTGRES_PASSWORD=<tu-password-local-segura>
   POSTGRES_DB=ceramica_prod_db
   DATABASE_URL=postgresql://ceramica_admin:<tu-password-local-segura>@localhost:5435/ceramica_prod_db
   JWT_SECRET=clave_secreta_jwt_super_segura_minimo_32_caracteres_xyz123!
   SEED_DEFAULT_PASSWORD=<password-temporal-seed>
   ```
2. Levantar PostgreSQL 16 en Docker:
   ```bash
   docker compose up -d
   ```
3. Aplicar esquema y cargar datos iniciales:
   ```bash
   npm run db:push
   npm run db:seed
   ```
4. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```

