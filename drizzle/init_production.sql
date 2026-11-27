-- ==============================================================================
-- CERÁMICA PRODUCCIÓN ERP - Esquema SQL Oficial y Semilla Inicial (2 Turnos: Mañana y Tarde)
-- Ejecutar en la base de datos: ceramica_prod_db (dentro de postgres-cluster)
-- ==============================================================================

-- 1. TIPOS ENUMERADOS (ENUMS)
DO $$ BEGIN
    CREATE TYPE "public"."production_stage_enum" AS ENUM('EXTRUSORA', 'SECADERO', 'CARGA_MANUAL', 'CARGA_ROBOT', 'HORNO_CARGADAS', 'HORNO_FUERA', 'DESCARGA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."role_enum" AS ENUM('ADMIN', 'DIRECTORIO', 'INGENIERO_ENCARGADO', 'CAPATAZ');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."shift_status_enum" AS ENUM('EN_CURSO', 'CERRADO', 'AUDITADO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."shift_type_enum" AS ENUM('MANANA', 'TARDE', 'NOCHE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLAS
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role_enum" DEFAULT 'CAPATAZ' NOT NULL,
	"default_shift" "shift_type_enum" DEFAULT 'MANANA',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "brick_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"dimensions" text NOT NULL,
	"units_per_bench" integer DEFAULT 480 NOT NULL,
	"units_per_wagon" integer DEFAULT 1440 NOT NULL,
	"unit_weight_kg" double precision DEFAULT 4.2 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "brick_types_code_unique" UNIQUE("code")
);

CREATE TABLE IF NOT EXISTS "shift_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"production_date" text NOT NULL,
	"shift" "shift_type_enum" NOT NULL,
	-- Trazabilidad del Capataz (Apertura, 5 Etapas y Cierre)
	"foreman_id" integer,
	"foreman_name" text NOT NULL,
	"status" "shift_status_enum" DEFAULT 'EN_CURSO' NOT NULL,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"closed_by_id" integer,
	"reopened_by_id" integer,
	"reopened_at" timestamp,
	-- Trazabilidad separada de Salida de Material, Consumo de Gas y Viajes de Tierra
	"gas_consumption" double precision DEFAULT 0 NOT NULL,
	"dispatched_tons" double precision DEFAULT 0 NOT NULL,
	"black_earth_trips" integer DEFAULT 0 NOT NULL,
	"red_earth_trips" integer DEFAULT 0 NOT NULL,
	"supplies_user_id" integer,
	"supplies_user_name" text,
	"supplies_updated_at" timestamp,
	"notes" text DEFAULT '',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shift_reports_foreman_id_users_id_fk" FOREIGN KEY ("foreman_id") REFERENCES "public"."users"("id") ON DELETE SET NULL,
	CONSTRAINT "shift_reports_closed_by_id_users_id_fk" FOREIGN KEY ("closed_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL,
	CONSTRAINT "shift_reports_reopened_by_id_users_id_fk" FOREIGN KEY ("reopened_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL,
	CONSTRAINT "shift_reports_supplies_user_id_users_id_fk" FOREIGN KEY ("supplies_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL,
	CONSTRAINT "shift_reports_two_shifts_check" CHECK ("shift" IN ('MANANA', 'TARDE'))
);

CREATE TABLE IF NOT EXISTS "shift_stage_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"shift_report_id" integer NOT NULL,
	"stage" "production_stage_enum" NOT NULL,
	"brick_type_id" integer NOT NULL,
	"quantity" double precision DEFAULT 0 NOT NULL,
	"estimated_units" integer DEFAULT 0 NOT NULL,
	"estimated_tons" double precision DEFAULT 0 NOT NULL,
	CONSTRAINT "shift_stage_entries_shift_report_id_shift_reports_id_fk" FOREIGN KEY ("shift_report_id") REFERENCES "public"."shift_reports"("id") ON DELETE CASCADE,
	CONSTRAINT "shift_stage_entries_brick_type_id_brick_types_id_fk" FOREIGN KEY ("brick_type_id") REFERENCES "public"."brick_types"("id") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "user_passkeys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"device_name" text DEFAULT 'Celular / Dispositivo Móvil' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_passkeys_credential_id_unique" UNIQUE("credential_id"),
	CONSTRAINT "user_passkeys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"user_name" text NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"details" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL
);

-- 3. ÍNDICES
CREATE UNIQUE INDEX IF NOT EXISTS "shift_reports_date_shift_idx" ON "shift_reports" ("production_date", "shift");
CREATE INDEX IF NOT EXISTS "shift_reports_date_idx" ON "shift_reports" ("production_date");
CREATE INDEX IF NOT EXISTS "stage_entries_report_idx" ON "shift_stage_entries" ("shift_report_id");

-- 4. USUARIOS INICIALES (Password por defecto: Ceramica2026!)
INSERT INTO "users" ("name", "username", "email", "password_hash", "role", "default_shift")
VALUES
  ('Administrador General', 'admin', 'admin@ceramica-planta.com', '$2b$10$un3ms6htX6T/C/yVf7YVlu7IHjd.GF6k8poMT9ybdyiINvCsrKeCe', 'ADMIN', 'MANANA'),
  ('Directorio / Socio Gerente', 'directorio', 'directorio@ceramica-planta.com', '$2b$10$un3ms6htX6T/C/yVf7YVlu7IHjd.GF6k8poMT9ybdyiINvCsrKeCe', 'DIRECTORIO', 'MANANA'),
  ('Encargado (Salida, Gas y Tierra)', 'encargado', 'encargado@ceramica-planta.com', '$2b$10$un3ms6htX6T/C/yVf7YVlu7IHjd.GF6k8poMT9ybdyiINvCsrKeCe', 'INGENIERO_ENCARGADO', 'MANANA'),
  ('Roberto Gómez (Capataz)', 'capataz.manana', 'manana@ceramica-planta.com', '$2b$10$un3ms6htX6T/C/yVf7YVlu7IHjd.GF6k8poMT9ybdyiINvCsrKeCe', 'CAPATAZ', 'MANANA'),
  ('Carlos Díaz (Capataz)', 'capataz.tarde', 'tarde@ceramica-planta.com', '$2b$10$un3ms6htX6T/C/yVf7YVlu7IHjd.GF6k8poMT9ybdyiINvCsrKeCe', 'CAPATAZ', 'TARDE')
ON CONFLICT ("username") DO NOTHING;

-- 5. CATÁLOGO DE LADRILLOS INICIAL
INSERT INTO "brick_types" ("code", "name", "dimensions", "units_per_bench", "units_per_wagon", "unit_weight_kg", "sort_order")
VALUES
  ('H8', 'Hueco 8x18x33', '8 x 18 x 33 cm', 600, 1800, 3.1, 1),
  ('H12', 'Hueco 12x18x33', '12 x 18 x 33 cm', 480, 1440, 4.2, 2),
  ('H18', 'Hueco 18x18x33', '18 x 18 x 33 cm', 320, 960, 6.1, 3),
  ('P12', 'Portante 12x19x33', '12 x 19 x 33 cm', 450, 1350, 5.4, 4),
  ('P18', 'Portante 18x19x33', '18 x 19 x 33 cm', 300, 900, 7.5, 5),
  ('BOV', 'Bovedilla 12x25x42', '12 x 25 x 42 cm', 260, 780, 6.8, 6)
ON CONFLICT ("code") DO NOTHING;
