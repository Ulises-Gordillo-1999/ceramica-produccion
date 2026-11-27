import bcrypt from 'bcryptjs';
import { db } from './index';
import {
  users,
  brickTypes,
  shiftReports,
  shiftStageEntries,
  auditLogs,
  type ShiftType,
  type ProductionStageType,
} from './schema';
import { sql } from 'drizzle-orm';

function formatLocalDate(daysOffset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Asegura y migra automáticamente el esquema en PostgreSQL:
 * 1. Crea tipos y tablas si no existen.
 * 2. Agrega las nuevas columnas de trazabilidad de Apertura/Cierre (opened_at, closed_by_id, reopened_by_id, reopened_at)
 *    y de Separación de Carga de Suministros (supplies_user_id, supplies_user_name, supplies_updated_at).
 * 3. Migra los datos vivos: elimina turnos NOCHE, elimina usuario capataz.noche, actualiza nombres de capataces rotativos
 *    y aplica constraint CHECK ('MANANA', 'TARDE') a nivel de base de datos.
 */
export async function ensureDatabaseSchema(): Promise<void> {
  try {
    await db.execute(sql`
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
        "foreman_id" integer,
        "foreman_name" text NOT NULL,
        "status" "shift_status_enum" DEFAULT 'EN_CURSO' NOT NULL,
        "opened_at" timestamp DEFAULT now() NOT NULL,
        "closed_at" timestamp,
        "closed_by_id" integer,
        "reopened_by_id" integer,
        "reopened_at" timestamp,
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
        CONSTRAINT "shift_reports_foreman_id_users_id_fk" FOREIGN KEY ("foreman_id") REFERENCES "public"."users"("id") ON DELETE SET NULL
      );

      -- Migración automática sobre tablas existentes en producción:
      ALTER TABLE "shift_reports" ADD COLUMN IF NOT EXISTS "opened_at" timestamp DEFAULT now() NOT NULL;
      ALTER TABLE "shift_reports" ADD COLUMN IF NOT EXISTS "closed_by_id" integer REFERENCES "public"."users"("id") ON DELETE SET NULL;
      ALTER TABLE "shift_reports" ADD COLUMN IF NOT EXISTS "reopened_by_id" integer REFERENCES "public"."users"("id") ON DELETE SET NULL;
      ALTER TABLE "shift_reports" ADD COLUMN IF NOT EXISTS "reopened_at" timestamp;
      ALTER TABLE "shift_reports" ADD COLUMN IF NOT EXISTS "supplies_user_id" integer REFERENCES "public"."users"("id") ON DELETE SET NULL;
      ALTER TABLE "shift_reports" ADD COLUMN IF NOT EXISTS "supplies_user_name" text;
      ALTER TABLE "shift_reports" ADD COLUMN IF NOT EXISTS "supplies_updated_at" timestamp;

      -- Purgar turnos NOCHE antiguos y usuario capataz.noche, y actualizar nombres a Capataces Rotativos:
      DELETE FROM "shift_reports" WHERE "shift" = 'NOCHE';
      DELETE FROM "users" WHERE "username" = 'capataz.noche';
      UPDATE "users" SET "default_shift" = 'MANANA' WHERE "default_shift" = 'NOCHE';
      UPDATE "users" SET "name" = 'Roberto Gómez (Capataz)' WHERE "username" = 'capataz.manana';
      UPDATE "users" SET "name" = 'Carlos Díaz (Capataz)' WHERE "username" = 'capataz.tarde';
      UPDATE "users" SET "name" = 'Encargado (Salida, Gas y Tierra)' WHERE "username" = 'encargado';

      -- Restricción CHECK a nivel de motor PostgreSQL: solo permitir turnos MANANA y TARDE
      ALTER TABLE "shift_reports" DROP CONSTRAINT IF EXISTS "shift_reports_two_shifts_check";
      ALTER TABLE "shift_reports" ADD CONSTRAINT "shift_reports_two_shifts_check" CHECK ("shift" IN ('MANANA', 'TARDE'));

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

      CREATE UNIQUE INDEX IF NOT EXISTS "shift_reports_date_shift_idx" ON "shift_reports" ("production_date", "shift");
      CREATE INDEX IF NOT EXISTS "shift_reports_date_idx" ON "shift_reports" ("production_date");
      CREATE INDEX IF NOT EXISTS "stage_entries_report_idx" ON "shift_stage_entries" ("shift_report_id");
    `);
  } catch (err) {
    console.warn('⚠️ [AUTO-SCHEMA] Aviso al validar o migrar estructura de tablas:', err);
  }
}

export async function runAutoSeed(): Promise<{ success: boolean; message: string }> {
  try {
    // 0. Asegurar esquema y migraciones en base de datos
    await ensureDatabaseSchema();

    const defaultPass = process.env.SEED_DEFAULT_PASSWORD || 'Ceramica2026!';
    const passwordHash = await bcrypt.hash(defaultPass, 10);

    // 1. Usuarios por rol (Sin capataz.noche; capataces rotativos y encargado de suministros)
    const insertedUsers = await db
      .insert(users)
      .values([
        {
          name: 'Administrador General',
          username: 'admin',
          email: 'admin@ceramica-planta.com',
          passwordHash,
          role: 'ADMIN',
          defaultShift: 'MANANA',
        },
        {
          name: 'Directorio / Socio Gerente',
          username: 'directorio',
          email: 'directorio@ceramica-planta.com',
          passwordHash,
          role: 'DIRECTORIO',
          defaultShift: 'MANANA',
        },
        {
          name: 'Encargado (Salida, Gas y Tierra)',
          username: 'encargado',
          email: 'encargado@ceramica-planta.com',
          passwordHash,
          role: 'INGENIERO_ENCARGADO',
          defaultShift: 'MANANA',
        },
        {
          name: 'Roberto Gómez (Capataz)',
          username: 'capataz.manana',
          email: 'manana@ceramica-planta.com',
          passwordHash,
          role: 'CAPATAZ',
          defaultShift: 'MANANA',
        },
        {
          name: 'Carlos Díaz (Capataz)',
          username: 'capataz.tarde',
          email: 'tarde@ceramica-planta.com',
          passwordHash,
          role: 'CAPATAZ',
          defaultShift: 'TARDE',
        },
      ])
      .onConflictDoNothing()
      .returning();

    const allUsers = insertedUsers.length > 0 ? insertedUsers : await db.query.users.findMany();
    const foremanManana = allUsers.find((u) => u.username === 'capataz.manana') || allUsers[0];
    const foremanTarde = allUsers.find((u) => u.username === 'capataz.tarde') || allUsers[0];
    const encargadoUser = allUsers.find((u) => u.username === 'encargado') || allUsers[0];

    // 2. Catálogo de Ladrillos
    await db
      .insert(brickTypes)
      .values([
        {
          code: 'H8',
          name: 'Hueco 8x18x33',
          dimensions: '8 x 18 x 33 cm',
          unitsPerBench: 600,
          unitsPerWagon: 1800,
          unitWeightKg: 3.1,
          sortOrder: 1,
        },
        {
          code: 'H12',
          name: 'Hueco 12x18x33',
          dimensions: '12 x 18 x 33 cm',
          unitsPerBench: 480,
          unitsPerWagon: 1440,
          unitWeightKg: 4.2,
          sortOrder: 2,
        },
        {
          code: 'H18',
          name: 'Hueco 18x18x33',
          dimensions: '18 x 18 x 33 cm',
          unitsPerBench: 320,
          unitsPerWagon: 960,
          unitWeightKg: 6.1,
          sortOrder: 3,
        },
        {
          code: 'P12',
          name: 'Portante 12x19x33',
          dimensions: '12 x 19 x 33 cm',
          unitsPerBench: 450,
          unitsPerWagon: 1350,
          unitWeightKg: 5.4,
          sortOrder: 4,
        },
        {
          code: 'P18',
          name: 'Portante 18x19x33',
          dimensions: '18 x 19 x 33 cm',
          unitsPerBench: 300,
          unitsPerWagon: 900,
          unitWeightKg: 7.5,
          sortOrder: 5,
        },
        {
          code: 'BOV',
          name: 'Bovedilla 12x25x42',
          dimensions: '12 x 25 x 42 cm',
          unitsPerBench: 260,
          unitsPerWagon: 780,
          unitWeightKg: 6.8,
          sortOrder: 6,
        },
      ])
      .onConflictDoNothing();

    const bricks = await db.query.brickTypes.findMany();
    const h12 = bricks.find((b) => b.code === 'H12') || bricks[0];
    const h18 = bricks.find((b) => b.code === 'H18') || bricks[0];
    const p18 = bricks.find((b) => b.code === 'P18') || bricks[0];

    // 3. Generar 7 días de turnos (2 turnos: MAÑANA y TARDE, rotando capataces)
    const shifts: {
      shift: ShiftType;
      foreman: typeof foremanManana;
      baseExtrusora: number;
      baseSecadero: number;
      baseManual: number;
      baseRobot: number;
      baseHornoIn: number;
      baseHornoOut: number;
      baseDescarga: number;
      baseGas: number;
      baseTons: number;
      blackTrips: number;
      redTrips: number;
    }[] = [
      {
        shift: 'MANANA',
        foreman: foremanManana,
        baseExtrusora: 42,
        baseSecadero: 40,
        baseManual: 8,
        baseRobot: 32,
        baseHornoIn: 14,
        baseHornoOut: 14,
        baseDescarga: 15,
        baseGas: 4850,
        baseTons: 118.5,
        blackTrips: 9,
        redTrips: 6,
      },
      {
        shift: 'TARDE',
        foreman: foremanTarde,
        baseExtrusora: 38,
        baseSecadero: 37,
        baseManual: 6,
        baseRobot: 30,
        baseHornoIn: 13,
        baseHornoOut: 13,
        baseDescarga: 13,
        baseGas: 4720,
        baseTons: 94.0,
        blackTrips: 7,
        redTrips: 5,
      },
    ];

    for (let offset = -6; offset <= 0; offset++) {
      const dateStr = formatLocalDate(offset);
      const brickOfDay = offset % 3 === 0 ? h18 : offset % 2 === 0 ? h12 : p18;

      for (const s of shifts) {
        // Para hoy (offset 0), dejamos TARDE sin iniciar para que el capataz vea el botón "Abrir / Iniciar Turno"
        if (offset === 0 && s.shift === 'TARDE') continue;

        const variance = ((Math.abs(offset) * 3 + (s.shift === 'MANANA' ? 2 : 1)) % 5) - 2;
        // Demostrar rotación de capataces entre días pares e impares
        const rotatedForeman =
          Math.abs(offset) % 2 === 1
            ? s.shift === 'MANANA'
              ? foremanTarde
              : foremanManana
            : s.foreman;

        const [report] = await db
          .insert(shiftReports)
          .values({
            productionDate: dateStr,
            shift: s.shift,
            foremanId: rotatedForeman ? rotatedForeman.id : null,
            foremanName: rotatedForeman ? rotatedForeman.name : 'Capataz de Turno',
            status: 'CERRADO',
            openedAt: new Date(),
            closedAt: new Date(),
            closedById: rotatedForeman ? rotatedForeman.id : null,
            gasConsumption: Math.max(0, s.baseGas + variance * 90),
            dispatchedTons: s.baseTons > 0 ? Number((s.baseTons + variance * 6.5).toFixed(1)) : 0,
            blackEarthTrips: Math.max(0, s.blackTrips + (variance > 0 ? 1 : 0)),
            redEarthTrips: Math.max(0, s.redTrips + (variance < 0 ? 1 : 0)),
            suppliesUserId: encargadoUser ? encargadoUser.id : null,
            suppliesUserName: encargadoUser ? encargadoUser.name : 'Encargado',
            suppliesUpdatedAt: new Date(),
            notes: 'Producción normal sin paradas mecánicas relevantes.',
          })
          .onConflictDoNothing()
          .returning();

        if (!report) continue;

        const stageValues: { stage: ProductionStageType; qty: number; isWagon: boolean }[] = [
          { stage: 'EXTRUSORA', qty: Math.max(0, s.baseExtrusora + variance), isWagon: false },
          { stage: 'SECADERO', qty: Math.max(0, s.baseSecadero + variance), isWagon: false },
          { stage: 'CARGA_MANUAL', qty: Math.max(0, s.baseManual), isWagon: false },
          { stage: 'CARGA_ROBOT', qty: Math.max(0, s.baseRobot + variance), isWagon: false },
          { stage: 'HORNO_CARGADAS', qty: Math.max(1, s.baseHornoIn + (variance > 1 ? 1 : 0)), isWagon: true },
          { stage: 'HORNO_FUERA', qty: Math.max(1, s.baseHornoOut + (variance > 1 ? 1 : 0)), isWagon: true },
          { stage: 'DESCARGA', qty: Math.max(0, s.baseDescarga + (variance > 0 ? 1 : 0)), isWagon: true },
        ];

        for (const st of stageValues) {
          if (st.qty <= 0) continue;
          const factor = st.isWagon ? brickOfDay.unitsPerWagon : brickOfDay.unitsPerBench;
          const estimatedUnits = Math.round(st.qty * factor);
          const estimatedTons = Number(((estimatedUnits * brickOfDay.unitWeightKg) / 1000).toFixed(2));

          await db.insert(shiftStageEntries).values({
            shiftReportId: report.id,
            stage: st.stage,
            brickTypeId: brickOfDay.id,
            quantity: st.qty,
            estimatedUnits,
            estimatedTons,
          });
        }
      }
    }

    await db.insert(auditLogs).values({
      userId: foremanManana ? foremanManana.id : null,
      userName: foremanManana ? foremanManana.name : 'Sistema',
      action: 'AUTO_SEED',
      entity: 'SYSTEM',
      details: 'Inicialización automática de catálogo y 7 días de turnos (Mañana y Tarde).',
    });

    return { success: true, message: '7 días de turnos (Mañana y Tarde) cargados exitosamente.' };
  } catch (err) {
    console.error('Error en runAutoSeed:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Error desconocido al sembrar datos.',
    };
  }
}

let schemaMigratedInProcess = false;

/**
 * Ejecuta siempre la migración de esquema/limpieza de BD (incluso si ya hay turnos),
 * y si la tabla está vacía o el día de hoy aún no tiene turnos, los inicializa.
 */
export async function ensureDatabaseSeeded(): Promise<boolean> {
  try {
    if (!schemaMigratedInProcess) {
      await ensureDatabaseSchema();
      schemaMigratedInProcess = true;
    }

    const existing = await db.select({ count: sql<number>`count(*)` }).from(shiftReports);
    const count = Number(existing[0]?.count || 0);

    if (count > 0) {
      return false; // Ya tiene datos y el esquema ya fue migrado
    }

    console.log('🌱 [AUTO-SEED] Base de datos sin turnos. Ejecutando inicialización automática...');
    const result = await runAutoSeed();
    console.log(`✅ [AUTO-SEED] Resultado: ${result.message}`);
    return result.success;
  } catch (err) {
    console.warn('⚠️ [AUTO-SEED] No se pudo verificar o sembrar la base de datos:', err);
    return false;
  }
}
