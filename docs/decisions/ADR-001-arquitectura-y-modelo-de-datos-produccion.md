# ADR-001: Arquitectura de Partes por Turno, Equivalencias Paramétricas y Autenticación WebAuthn

## Estado
Aceptado

## Fecha
2026-11-11

## Contexto
La planta cerámica registraba la producción de sus 3 turnos diarios (Mañana, Tarde y Noche) en una planilla estática dividida en 5 etapas de línea (`EXTRUSORA`, `SECADERO`, `CARGA DE BANCO`, `HORNO`, `DESCARGA`) y un bloque de suministros/despacho (`SALIDA MATERIAL`, `CONSUMO DE GAS`, `VIAJES TIERRA`).

Se requería digitalizar el proceso mediante una aplicación web responsiva e instalable (PWA) donde:
1. Los **Capataces** carguen los datos desde sus teléfonos móviles en planta con mínima fricción e ingreso por huella digital.
2. Los **Dueños, Ingenieros y Encargados** visualicen en tiempo real el avance del día, naveguen entre fechas históricas, comparen producciones y descarguen reportes PDF.
3. La base de datos sea escalable ante cambios de molde dentro de un mismo turno o incorporación de nuevas máquinas/ladrillos.

## Decisión
1. **Modelo de Datos Relacional Desacoplado (`shift_reports` + `shift_stage_entries` + `brick_types`):**
   - En lugar de crear una tabla plana con columnas fijas por etapa, se separó la cabecera del turno (`shift_reports`, con clave única `(production_date, shift)`) del detalle por etapa (`shift_stage_entries`).
   - Esto permite que una misma etapa registre $1..N$ tipos de ladrillo en un mismo turno cuando ocurre un cambio de molde en la extrusora o en el horno, sin alterar el esquema SQL.
2. **Catálogo Paramétrico de Ladrillos (`brick_types`):**
   - Cada modelo de ladrillo almacena sus factores industriales (`units_per_bench`, `units_per_wagon`, `unit_weight_kg`). Al guardar un parte, el backend calcula y persiste las unidades estimadas y toneladas (`estimated_units`, `estimated_tons`), habilitando KPIs de ingeniería ($\text{m}^3$ de gas por tonelada cocida) sin exigir cálculos manuales al capataz.
3. **Autenticación Híbrida JWT (`jose`) + Biometría WebAuthn (`user_passkeys`):**
   - La sesión principal viaja en una cookie `HttpOnly` firmada con HS256 (`jose`), validada en Edge Middleware según matriz RBAC (`ADMIN`, `DIRECTORIO`, `INGENIERO_ENCARGADO`, `CAPATAZ`).
   - Se complementa con credenciales WebAuthn vinculadas al sensor biométrico del dispositivo móvil para ingreso de 1 toque en la PWA.

## Alternativas Consideradas

### Alternativa A: Tabla Única Plana (Réplica literal de las celdas de Excel)
- **Pros:** Consultas SQL iniciales más simples.
- **Contras:** Impide registrar dos medidas de ladrillo en el mismo turno y obliga a ejecutar migraciones destructivas si se agrega una máquina o etapa.
- **Motivo de descarte:** Falta de escalabilidad operativa.

### Alternativa B: Proveedor de Autenticación Externo (Auth0 / Clerk)
- **Pros:** Menor código propio de autenticación.
- **Contras:** Costo recurrente por usuario activo, dependencia de servicios externos y menor control sobre el flujo offline/local en VPS Hetzner + Coolify.
- **Motivo de descarte:** El estándar arquitectónico exige autonomía total en Hetzner/Coolify con costo cero de licencias externas.

## Consecuencias y Compensaciones
- **Beneficios:** Carga móvil rápida para el capataz, conversión automática de bancos/zorras a ladrillos/toneladas, trazabilidad en `audit_logs` y cero parpadeo visual entre temas Claro/Oscuro.
- **Compromisos:** Requiere mantener actualizado el catálogo de ladrillos (`units_per_bench` y `units_per_wagon`) cuando se incorpore una nueva matriz/molde en fábrica.

