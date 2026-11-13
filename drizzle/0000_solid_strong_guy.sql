CREATE TYPE "public"."production_stage_enum" AS ENUM('EXTRUSORA', 'SECADERO', 'CARGA_MANUAL', 'CARGA_ROBOT', 'HORNO_CARGADAS', 'HORNO_FUERA', 'DESCARGA');--> statement-breakpoint
CREATE TYPE "public"."role_enum" AS ENUM('ADMIN', 'DIRECTORIO', 'INGENIERO_ENCARGADO', 'CAPATAZ');--> statement-breakpoint
CREATE TYPE "public"."shift_status_enum" AS ENUM('EN_CURSO', 'CERRADO', 'AUDITADO');--> statement-breakpoint
CREATE TYPE "public"."shift_type_enum" AS ENUM('MANANA', 'TARDE', 'NOCHE');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"user_name" text NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"details" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brick_types" (
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
--> statement-breakpoint
CREATE TABLE "shift_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"production_date" text NOT NULL,
	"shift" "shift_type_enum" NOT NULL,
	"foreman_id" integer,
	"foreman_name" text NOT NULL,
	"status" "shift_status_enum" DEFAULT 'EN_CURSO' NOT NULL,
	"gas_consumption" double precision DEFAULT 0 NOT NULL,
	"dispatched_tons" double precision DEFAULT 0 NOT NULL,
	"black_earth_trips" integer DEFAULT 0 NOT NULL,
	"red_earth_trips" integer DEFAULT 0 NOT NULL,
	"notes" text DEFAULT '',
	"closed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_stage_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"shift_report_id" integer NOT NULL,
	"stage" "production_stage_enum" NOT NULL,
	"brick_type_id" integer NOT NULL,
	"quantity" double precision DEFAULT 0 NOT NULL,
	"estimated_units" integer DEFAULT 0 NOT NULL,
	"estimated_tons" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_passkeys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"device_name" text DEFAULT 'Celular / Dispositivo Móvil' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_passkeys_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
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
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_reports" ADD CONSTRAINT "shift_reports_foreman_id_users_id_fk" FOREIGN KEY ("foreman_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_stage_entries" ADD CONSTRAINT "shift_stage_entries_shift_report_id_shift_reports_id_fk" FOREIGN KEY ("shift_report_id") REFERENCES "public"."shift_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_stage_entries" ADD CONSTRAINT "shift_stage_entries_brick_type_id_brick_types_id_fk" FOREIGN KEY ("brick_type_id") REFERENCES "public"."brick_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_passkeys" ADD CONSTRAINT "user_passkeys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "shift_reports_date_shift_idx" ON "shift_reports" USING btree ("production_date","shift");--> statement-breakpoint
CREATE INDEX "shift_reports_date_idx" ON "shift_reports" USING btree ("production_date");--> statement-breakpoint
CREATE INDEX "stage_entries_report_idx" ON "shift_stage_entries" USING btree ("shift_report_id");