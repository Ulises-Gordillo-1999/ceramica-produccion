# Guía de Despliegue en Hetzner VPS con Coolify v4

Este documento detalla el procedimiento paso a paso para desplegar **CERÁMICA PRODUCCIÓN ERP** en tu VPS de Hetzner Cloud administrada mediante **Coolify v4**, con dominio propio, certificado SSL automático (HTTPS), base de datos PostgreSQL 16 y PWA con huella digital habilitada.

---

## 📋 Requisitos Previos en Coolify
* Acceso a tu panel web de Coolify (ej. `http://<ip-vps>:8000` o tu dominio de Coolify).
* El repositorio en GitHub: `https://github.com/Ulises-Gordillo-1999/ceramica-produccion.git` (público o conectado con GitHub App).

---

## 🗄️ Paso 1: Crear la Base de Datos Lógica en el `postgres-cluster` Compartido

> [!IMPORTANT]
> **Optimización de Recursos del VPS:** Siguiendo la arquitectura global del servidor, **NO crees un nuevo recurso/contenedor de PostgreSQL**. Todas las aplicaciones (`UPGRADE ERP`, `Feltrin-Gym`, `Diogo Barber Shop` y ahora `Cerámica Producción`) comparten la instancia centralizada **`postgres-cluster`** (alojada en el proyecto `UPGRADE`), ahorrando memoria RAM y manteniendo backups centralizados.

1. En Coolify, ve al proyecto **`UPGRADE`** $\rightarrow$ recurso **`postgres-cluster`**.
2. En la pestaña **`Terminal`** (o desde tu cliente PostgreSQL conectado a la VPS), abre una sesión `psql` y ejecuta:
   ```sql
   -- Crear usuario dedicado para la aplicación
   CREATE USER ceramica_user WITH PASSWORD 'tu_password_segura_aqui';

   -- Crear la base de datos lógica para Cerámica Producción
   CREATE DATABASE ceramica_prod_db OWNER ceramica_user;

   -- Otorgar permisos completos
   GRANT ALL PRIVILEGES ON DATABASE ceramica_prod_db TO ceramica_user;
   ```
3. La URL interna para conectar la aplicación dentro de la red Docker de Coolify será:
   ```text
   postgresql://ceramica_user:tu_password_segura_aqui@postgres-cluster:5432/ceramica_prod_db
   ```
   *(O reemplaza `postgres-cluster` por el Internal Hostname / Docker Alias que Coolify muestre en la configuración de dicho recurso).*

---

## 🚀 Paso 2: Crear el Recurso de la Aplicación en Coolify

1. Puedes crear un proyecto nuevo llamado **`Ceramica-Produccion`** (o dentro de tu entorno preferido) y pulsar **`+ New Resource`**.
2. Selecciona **`Application`** $\rightarrow$ **`Public Repository`** (o GitHub Private Repository).
3. Configuración del Repositorio:
   - **Repository URL:** `https://github.com/Ulises-Gordillo-1999/ceramica-produccion.git`
   - **Branch:** `main`
   - **Build Pack:** **`Dockerfile`**
4. En la configuración general de la aplicación:
   - **Port:** `3000`
   - **Domains:** Escribe la URL HTTPS que tendrá tu aplicación (ej. `https://planta.tu-dominio.com` o el dominio asignado en Coolify).
   *(Al colocar `https://`, Coolify y Traefik gestionan automáticamente el certificado SSL gratuito con Let's Encrypt).*

---

## 🔐 Paso 3: Configurar las Variables de Entorno en Coolify

En la pestaña **`Environment Variables`** de la aplicación, agrega:

| Variable | Valor Recomendado | Propósito |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Modo optimizado de Next.js |
| `DATABASE_URL` | `postgresql://ceramica_user:tu_password_segura@postgres-cluster:5432/ceramica_prod_db` | Conexión interna a la BD en `postgres-cluster` |
| `JWT_SECRET` | *(Generar un texto aleatorio seguro de $\ge 32$ caracteres)* | Clave criptográfica para firmas de sesión JWT |
| `SEED_DEFAULT_PASSWORD` | `Ceramica2026!` *(o la que elijas)* | Contraseña inicial de los perfiles de planta |

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

