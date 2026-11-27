import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role_enum', [
  'ADMIN',
  'DIRECTORIO',
  'INGENIERO_ENCARGADO',
  'CAPATAZ',
]);

export const shiftTypeEnum = pgEnum('shift_type_enum', [
  'MANANA',
  'TARDE',
  'NOCHE',
]);

export const shiftStatusEnum = pgEnum('shift_status_enum', [
  'EN_CURSO',
  'CERRADO',
  'AUDITADO',
]);

export const productionStageEnum = pgEnum('production_stage_enum', [
  'EXTRUSORA',
  'SECADERO',
  'CARGA_MANUAL',
  'CARGA_ROBOT',
  'HORNO_CARGADAS',
  'HORNO_FUERA',
  'DESCARGA',
]);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull().default('CAPATAZ'),
  defaultShift: shiftTypeEnum('default_shift').default('MANANA'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userPasskeys = pgTable('user_passkeys', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  credentialId: text('credential_id').notNull().unique(),
  publicKey: text('public_key').notNull(),
  deviceName: text('device_name').notNull().default('Celular / Dispositivo Móvil'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const brickTypes = pgTable('brick_types', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  dimensions: text('dimensions').notNull(),
  unitsPerBench: integer('units_per_bench').notNull().default(480),
  unitsPerWagon: integer('units_per_wagon').notNull().default(1440),
  unitWeightKg: doublePrecision('unit_weight_kg').notNull().default(4.2),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(1),
});

export const shiftReports = pgTable(
  'shift_reports',
  {
    id: serial('id').primaryKey(),
    productionDate: text('production_date').notNull(), // YYYY-MM-DD
    shift: shiftTypeEnum('shift').notNull(), // Activos: 'MANANA' | 'TARDE'
    // 1. Trazabilidad de Apertura y Cierre del Capataz (5 Etapas)
    foremanId: integer('foreman_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    foremanName: text('foreman_name').notNull(),
    status: shiftStatusEnum('status').notNull().default('EN_CURSO'),
    openedAt: timestamp('opened_at').defaultNow().notNull(),
    closedAt: timestamp('closed_at'),
    closedById: integer('closed_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    reopenedById: integer('reopened_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    reopenedAt: timestamp('reopened_at'),
    // 2. Carga separada de Salida de Material, Consumo de Gas y Viajes de Tierra (Otra persona / Encargado)
    gasConsumption: doublePrecision('gas_consumption').notNull().default(0),
    dispatchedTons: doublePrecision('dispatched_tons').notNull().default(0),
    blackEarthTrips: integer('black_earth_trips').notNull().default(0),
    redEarthTrips: integer('red_earth_trips').notNull().default(0),
    suppliesUserId: integer('supplies_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    suppliesUserName: text('supplies_user_name'),
    suppliesUpdatedAt: timestamp('supplies_updated_at'),
    notes: text('notes').default(''),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('shift_reports_date_shift_idx').on(table.productionDate, table.shift),
    index('shift_reports_date_idx').on(table.productionDate),
  ]
);

export const shiftStageEntries = pgTable(
  'shift_stage_entries',
  {
    id: serial('id').primaryKey(),
    shiftReportId: integer('shift_report_id')
      .notNull()
      .references(() => shiftReports.id, { onDelete: 'cascade' }),
    stage: productionStageEnum('stage').notNull(),
    brickTypeId: integer('brick_type_id')
      .notNull()
      .references(() => brickTypes.id, { onDelete: 'restrict' }),
    quantity: doublePrecision('quantity').notNull().default(0),
    estimatedUnits: integer('estimated_units').notNull().default(0),
    estimatedTons: doublePrecision('estimated_tons').notNull().default(0),
  },
  (table) => [
    index('stage_entries_report_idx').on(table.shiftReportId),
  ]
);

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  userName: text('user_name').notNull(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  details: text('details').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type BrickType = typeof brickTypes.$inferSelect;
export type ShiftReport = typeof shiftReports.$inferSelect;
export type ShiftStageEntry = typeof shiftStageEntries.$inferSelect;
export type RoleType = (typeof roleEnum.enumValues)[number];
export type ShiftType = (typeof shiftTypeEnum.enumValues)[number];
export type ShiftStatusType = (typeof shiftStatusEnum.enumValues)[number];
export type ProductionStageType = (typeof productionStageEnum.enumValues)[number];
