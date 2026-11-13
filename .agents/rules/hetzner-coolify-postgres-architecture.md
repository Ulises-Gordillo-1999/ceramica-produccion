# Regla Global de Arquitectura: PostgreSQL Centralizado en Hetzner VPS con Coolify v4

## 📌 Contexto de Infraestructura del Servidor
En el servidor **VPS Hetzner Cloud** gestionado mediante **Coolify v4**, la infraestructura de bases de datos está diseñada bajo un modelo de **alta eficiencia de recursos y multitenancy lógico**.

### 1. El Cluster Centralizado (`postgres-cluster`)
- Existe un único recurso de base de datos en Coolify denominado **`postgres-cluster`** (ubicado dentro del proyecto principal `UPGRADE`).
- **Descripción en Coolify:** *"Servidor PostgreSQL 16 compartido para UPGRADE ERP y futuras aplicaciones"*.
- Aplicaciones actualmente conectadas al cluster:
  - `upgrade-erp`
  - `feltrin-gym` (feltringym.com)
  - `diogo-barber-shop` (barberia.upgrade-informatica.com)
  - `ceramica-produccion` (y futuros desarrollos)

---

## 🚫 Regla de Oro Innegociable
> **NUNCA crear ni sugerir crear un nuevo recurso / contenedor Docker de PostgreSQL en Coolify para cada proyecto individual.**
> 
> Levantar contenedores PostgreSQL duplicados desperdicia entre 150 MB y 250 MB de memoria RAM en idle por instancia, fragmenta los backups y sobrecarga el VPS sin ningún beneficio real.

---

## 🛠️ Protocolo para Conectar Nuevos Proyectos al Cluster

### A. Creación de la Base de Datos Lógica y Usuario Dedicado
Para cada nueva aplicación que se despliegue en Coolify, se debe aprovisionar únicamente una **base de datos lógica** y un **rol de usuario aislado** dentro del `postgres-cluster` existente:

```sql
-- 1. Crear el usuario específico para la app con su contraseña segura
CREATE USER <app_user> WITH PASSWORD '<password_segura>';

-- 2. Crear la base de datos propia de la aplicación asignándole dicho dueño
CREATE DATABASE <app_db_name> OWNER <app_user>;

-- 3. Otorgar todos los privilegios sobre esa base de datos
GRANT ALL PRIVILEGES ON DATABASE <app_db_name> TO <app_user>;
```

### B. Configuración de Variables de Entorno en Coolify (Application Resource)
En el recurso tipo **Application** del proyecto en Coolify, configurar la variable de conexión apuntando al hostname interno de la red Docker:

```env
DATABASE_URL=postgresql://<app_user>:<password_segura>@postgres-cluster:5432/<app_db_name>
```

*(O utilizando el hostname interno / FQDN de Docker que Coolify asigne al recurso de base de datos).*

### C. Aislamiento y Seguridad
- Cada aplicación tiene acceso **únicamente** a sus propias tablas y datos.
- El usuario `<app_user>` no tiene permisos para inspeccionar ni alterar bases de datos de otros proyectos (`feltrin_gym`, `upgrade_erp`, etc.).
- Las contraseñas de producción y URLs reales **JAMÁS** deben guardarse en archivos `.env` versionados, READMEs o commits en Git (`env-security-protocol`).

---

## 💻 Desarrollo Local vs. Producción
- **En Desarrollo Local (PC de trabajo):** Se utiliza `docker-compose.yml` para levantar un PostgreSQL 16 local (ej. mapeado a puertos como `5432` o `5435`) con credenciales de prueba (`postgres:postgres`).
- **En Producción (Coolify):** La app en su contenedor Next.js standalone se conecta al `postgres-cluster` compartido.
