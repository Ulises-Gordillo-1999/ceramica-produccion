# Guía de Despliegue en Hetzner VPS con Coolify v4

Este documento detalla el procedimiento paso a paso para desplegar **CERÁMICA PRODUCCIÓN ERP** en tu VPS de Hetzner Cloud administrada mediante **Coolify v4**, con dominio propio, certificado SSL automático (HTTPS), base de datos PostgreSQL 16 y PWA con huella digital habilitada.

---

## 📋 Requisitos Previos en Coolify
* Acceso a tu panel web de Coolify (ej. `http://<ip-vps>:8000` o tu dominio de Coolify).
* El repositorio en GitHub: `https://github.com/Ulises-Gordillo-1999/ceramica-produccion.git` (público o conectado con GitHub App).

---

## 🗄️ Paso 1: Crear el Recurso de Base de Datos (PostgreSQL 16)

1. En tu Proyecto de Coolify, pulsa **`+ New Resource`**.
2. Selecciona **`Databases`** $\rightarrow$ **`PostgreSQL`**.
3. Configura los parámetros básicos:
   - **Name:** `ceramica-postgres`
   - **Database Name:** `ceramica_prod_db`
   - **Default User:** `ceramica_admin`
   - **Default Password:** Define una contraseña segura (o usa la generada por Coolify).
4. Pulsa **`Start`** para levantar el contenedor de la base de datos.
5. Copia la **Internal Database URL** que te muestra Coolify (formato `postgres://ceramica_admin:...@...:5432/ceramica_prod_db`).

---

## 🚀 Paso 2: Crear el Recurso de la Aplicación (Next.js 16 Standalone)

1. En el mismo Proyecto o Entorno, pulsa **`+ New Resource`**.
2. Selecciona **`Application`** $\rightarrow$ **`Public Repository`** (o GitHub Private Repository).
3. Configuración del Repositorio:
   - **Repository URL:** `https://github.com/Ulises-Gordillo-1999/ceramica-produccion.git`
   - **Branch:** `main`
   - **Build Pack:** **`Dockerfile`**
4. En la configuración general de la aplicación:
   - **Port:** `3000`
   - **Domains:** Escribe la URL HTTPS que tendrá tu aplicación (ej. `https://planta.tu-dominio.com` o el subdominio gratuito de Coolify).
   *(Al colocar `https://`, Coolify y Traefik gestionan automáticamente el certificado SSL gratuito con Let's Encrypt).*

---

## 🔐 Paso 3: Configurar las Variables de Entorno en Coolify

En la pestaña **`Environment Variables`** de la aplicación, agrega:

| Variable | Valor Recomendado | Propósito |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Modo optimizado de Next.js |
| `DATABASE_URL` | *(Pegar la Internal Database URL del Paso 1)* | Conexión directa a PostgreSQL en red interna |
| `JWT_SECRET` | *(Generar un texto aleatorio de $\ge 32$ caracteres)* | Clave criptográfica para firmas de sesión |
| `SEED_DEFAULT_PASSWORD` | `Ceramica2026!` *(o la que elijas)* | Contraseña inicial de los perfiles demo de planta |

---

## 📦 Paso 4: Desplegar la Aplicación

1. Pulsa el botón **`Deploy`** arriba a la derecha.
2. Coolify descargará el repositorio, ejecutará el `Dockerfile` multi-stage (con el `.dockerignore` ultra liviano) y levantará el contenedor de Next.js en el puerto 3000.
3. Observa los logs hasta ver: `✓ Ready in ...ms` y `Listening on 0.0.0.0:3000`.

---

## 🌱 Paso 5: Aplicar Esquema y Cargar Datos Iniciales de Planta

Una vez que la aplicación y PostgreSQL estén corriendo en Coolify:

1. En Coolify, ve a la aplicación **`ceramica-produccion`** $\rightarrow$ pestaña **`Terminal`** (o Execute Command).
2. Ejecuta:
   ```bash
   npm run db:push
   ```
   *(Aplica las tablas `shift_reports`, `brick_types`, `users`, `user_passkeys`, etc. en la base de datos de producción).*
3. Luego ejecuta:
   ```bash
   npm run db:seed
   ```
   *(Carga el catálogo inicial de ladrillos H8, H12, H18, P12, P18, BOV, los usuarios por rol y los 7 días de partes históricos).*

---

## 📱 Paso 6: Verificación en el Celular (PWA + Huella Digital)

1. Abre la URL HTTPS desde el navegador de tu celular (ej. `https://planta.tu-dominio.com`).
2. Toca **`Instalar App`** para agregarla a la pantalla de inicio del teléfono.
3. Inicia sesión con cualquiera de los capataces (`capataz.manana`, `capataz.tarde`, `capataz.noche`).
4. Abre el menú lateral, pulsa **`Acceso con Huella`** $\rightarrow$ **`Activar Huella Digital Ahora`** y apoya el dedo en el lector biométrico.
5. Cierra sesión y prueba entrar con un solo toque tocando **`Ingresar con Huella Digital`**.
