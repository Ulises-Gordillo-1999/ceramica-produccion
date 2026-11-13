# Regla Global de Arquitectura: PostgreSQL Centralizado en Hetzner VPS con Coolify v4

## 📌 Contexto de Infraestructura del Servidor
En el servidor **VPS Hetzner Cloud** gestionado mediante **Coolify v4**, la infraestructura de bases de datos está centralizada en un único recurso para optimizar memoria RAM:

### 1. El Cluster Centralizado (`postgres-cluster`)
- Existe un único recurso de base de datos en Coolify denominado **`postgres-cluster`** (ubicado dentro del proyecto principal `UPGRADE`).
- **Internal Hostname / Alias en Docker:** `ltrcdiafjfrwcub9cpypfq1y` (puerto `5432`).
- **Usuario Maestro del Cluster:** `postgres`.
- Aplicaciones actualmente conectadas al cluster:
  - `upgrade-erp` $\rightarrow$ DB: `upgrade_db` (Usuario: `postgres`)
  - `feltrin-gym` (feltringym.com) $\rightarrow$ DB: `feltrin_gym_db` (Usuario: `postgres`)
  - `diogo-barber-shop` (barberia.upgrade-informatica.com) $\rightarrow$ DB: `diogo_barber` (Usuario: `postgres`)
  - `ceramica-produccion` $\rightarrow$ DB: `ceramica_prod_db` (Usuario: `ceramica_user` / `postgres`)

---

## 🚫 Regla de Oro Innegociable
> **NUNCA crear ni sugerir crear un nuevo recurso / contenedor Docker de PostgreSQL en Coolify para cada proyecto individual.**
> 
> Levantar contenedores PostgreSQL duplicados desperdicia entre 150 MB y 250 MB de memoria RAM en idle por instancia, fragmenta los backups y sobrecarga el VPS.

---

## 🛠️ Protocolo Estándar para Nuevos Proyectos (Flujo Rápido y Uniforme)

Para mantener la máxima simplicidad y no crear usuarios innecesarios si Ulises no lo pide:

### Paso 1: Crear únicamente la Base de Datos Lógica
En la terminal de `postgres-cluster`:
```bash
psql -U postgres -c "CREATE DATABASE <nombre_app_db>;"
```
*(No es obligatorio crear un nuevo usuario cada vez; se puede reutilizar directamente el usuario del cluster que ya tienen las demás apps).*

### Paso 2: Formato de la URL en Coolify (Environment Variables)
En el recurso tipo **Application** del nuevo proyecto:
```env
DATABASE_URL=postgres://postgres:<MASTER_PASSWORD>@ltrcdiafjfrwcub9cpypfq1y:5432/<nombre_app_db>
```
*(O con usuario específico si se solicita explícitamente).*

---

## 💻 Desarrollo Local vs. Producción
- **En Desarrollo Local (PC de trabajo):** Se utiliza `docker-compose.yml` para levantar un PostgreSQL local (puerto `5432` o `5435`) con credenciales demo (`postgres:postgres`).
- **En Producción (Coolify):** La app en su contenedor Next.js standalone se conecta al `postgres-cluster` compartido.
