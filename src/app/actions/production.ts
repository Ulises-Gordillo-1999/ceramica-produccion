'use server';

import { revalidatePath } from 'next/cache';
import { eq, and, gte, lte, desc, asc, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  brickTypes,
  shiftReports,
  shiftStageEntries,
  auditLogs,
  type ShiftType,
  type ShiftStatusType,
  type ProductionStageType,
  type BrickType,
} from '@/db/schema';
import {
  getSession,
  canEditAnyShift,
  canEditProductionStages,
  canEditSupplies,
} from '@/utils/auth';

export interface StageEntryDTO {
  id?: number;
  stage: ProductionStageType;
  brickTypeId: number;
  brickCode: string;
  brickName: string;
  quantity: number;
  estimatedUnits: number;
  estimatedTons: number;
}

export interface ShiftReportDTO {
  id: number;
  productionDate: string;
  shift: ShiftType;
  foremanId: number | null;
  foremanName: string;
  status: ShiftStatusType;
  gasConsumption: number;
  dispatchedTons: number;
  blackEarthTrips: number;
  redEarthTrips: number;
  notes: string;
  closedAt: string | null;
  updatedAt: string;
  entries: StageEntryDTO[];
}

export interface DailyProductionSummary {
  date: string;
  bricks: BrickType[];
  shifts: Record<ShiftType, ShiftReportDTO | null>;
  totals: {
    extrusoraBenches: number;
    secaderoBenches: number;
    cargaManualBenches: number;
    cargaRobotBenches: number;
    hornoCargadasWagons: number;
    hornoFueraWagons: number;
    descargaWagons: number;
    gasManana: number;
    gasTarde: number;
    gasNoche: number;
    totalGas: number;
    dispatchedTons: number;
    blackEarthTrips: number;
    redEarthTrips: number;
    estimatedExtrudedUnits: number;
    estimatedFiredTons: number;
  };
}

const WAGON_STAGES: ProductionStageType[] = ['HORNO_CARGADAS', 'HORNO_FUERA', 'DESCARGA'];

export async function getDailyProductionData(dateStr: string): Promise<DailyProductionSummary> {
  const allBricks = await db
    .select()
    .from(brickTypes)
    .orderBy(asc(brickTypes.sortOrder), asc(brickTypes.id));

  const brickMap = new Map<number, BrickType>();
  for (const b of allBricks) {
    brickMap.set(b.id, b);
  }

  let reports = await db
    .select()
    .from(shiftReports)
    .where(
      and(
        eq(shiftReports.productionDate, dateStr),
        inArray(shiftReports.shift, ['MANANA', 'TARDE'])
      )
    );

  // Si no hay reportes para el día y la base de datos está totalmente vacía, sembrar automáticamente
  if (reports.length === 0) {
    try {
      const totalReports = await db.select({ count: sql<number>`count(*)` }).from(shiftReports);
      if (Number(totalReports[0]?.count || 0) === 0) {
        const { ensureDatabaseSeeded } = await import('@/db/autoSeed');
        const seeded = await ensureDatabaseSeeded();
        if (seeded) {
          reports = await db
            .select()
            .from(shiftReports)
            .where(
              and(
                eq(shiftReports.productionDate, dateStr),
                inArray(shiftReports.shift, ['MANANA', 'TARDE'])
              )
            );
        }
      }
    } catch (err) {
      console.warn('Auto-seed check fallback warning:', err);
    }
  }

  const reportIds = reports.map((r) => r.id);
  const rawEntries =
    reportIds.length > 0
      ? await db
          .select()
          .from(shiftStageEntries)
          .where(inArray(shiftStageEntries.shiftReportId, reportIds))
      : [];

  const shiftsMap: Record<ShiftType, ShiftReportDTO | null> = {
    MANANA: null,
    TARDE: null,
    NOCHE: null,
  };

  const totals = {
    extrusoraBenches: 0,
    secaderoBenches: 0,
    cargaManualBenches: 0,
    cargaRobotBenches: 0,
    hornoCargadasWagons: 0,
    hornoFueraWagons: 0,
    descargaWagons: 0,
    gasManana: 0,
    gasTarde: 0,
    gasNoche: 0,
    totalGas: 0,
    dispatchedTons: 0,
    blackEarthTrips: 0,
    redEarthTrips: 0,
    estimatedExtrudedUnits: 0,
    estimatedFiredTons: 0,
  };

  for (const rep of reports) {
    const repEntries: StageEntryDTO[] = rawEntries
      .filter((e) => e.shiftReportId === rep.id)
      .map((e) => {
        const brick = brickMap.get(e.brickTypeId);
        return {
          id: e.id,
          stage: e.stage,
          brickTypeId: e.brickTypeId,
          brickCode: brick?.code || 'S/D',
          brickName: brick?.name || 'Ladrillo',
          quantity: e.quantity,
          estimatedUnits: e.estimatedUnits,
          estimatedTons: e.estimatedTons,
        };
      });

    for (const entry of repEntries) {
      if (entry.stage === 'EXTRUSORA') {
        totals.extrusoraBenches += entry.quantity;
        totals.estimatedExtrudedUnits += entry.estimatedUnits;
      } else if (entry.stage === 'SECADERO') {
        totals.secaderoBenches += entry.quantity;
      } else if (entry.stage === 'CARGA_MANUAL') {
        totals.cargaManualBenches += entry.quantity;
      } else if (entry.stage === 'CARGA_ROBOT') {
        totals.cargaRobotBenches += entry.quantity;
      } else if (entry.stage === 'HORNO_CARGADAS') {
        totals.hornoCargadasWagons += entry.quantity;
      } else if (entry.stage === 'HORNO_FUERA') {
        totals.hornoFueraWagons += entry.quantity;
        totals.estimatedFiredTons += entry.estimatedTons;
      } else if (entry.stage === 'DESCARGA') {
        totals.descargaWagons += entry.quantity;
      }
    }

    if (rep.shift === 'MANANA') totals.gasManana = rep.gasConsumption;
    if (rep.shift === 'TARDE') totals.gasTarde = rep.gasConsumption;
    if (rep.shift === 'NOCHE') totals.gasNoche = rep.gasConsumption;

    totals.dispatchedTons += rep.dispatchedTons;
    totals.blackEarthTrips += rep.blackEarthTrips;
    totals.redEarthTrips += rep.redEarthTrips;

    shiftsMap[rep.shift] = {
      id: rep.id,
      productionDate: rep.productionDate,
      shift: rep.shift,
      foremanId: rep.foremanId,
      foremanName: rep.foremanName,
      status: rep.status,
      gasConsumption: rep.gasConsumption,
      dispatchedTons: rep.dispatchedTons,
      blackEarthTrips: rep.blackEarthTrips,
      redEarthTrips: rep.redEarthTrips,
      notes: rep.notes || '',
      closedAt: rep.closedAt ? rep.closedAt.toISOString() : null,
      updatedAt: rep.updatedAt.toISOString(),
      entries: repEntries,
    };
  }

  totals.totalGas = Number((totals.gasManana + totals.gasTarde + totals.gasNoche).toFixed(1));
  totals.dispatchedTons = Number(totals.dispatchedTons.toFixed(1));
  totals.estimatedFiredTons = Number(totals.estimatedFiredTons.toFixed(1));

  return {
    date: dateStr,
    bricks: allBricks,
    shifts: shiftsMap,
    totals,
  };
}

export async function openShiftReportAction(input: {
  productionDate: string;
  shift: ShiftType;
  foremanName: string;
}): Promise<{ ok: boolean; error?: string; reportId?: number }> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: 'Debes iniciar sesión para abrir un turno.' };
  }

  if (!canEditProductionStages(session.role)) {
    return {
      ok: false,
      error: 'Solo el Capataz en turno o el Administrador pueden abrir o iniciar un turno.',
    };
  }

  const [existing] = await db
    .select()
    .from(shiftReports)
    .where(
      and(
        eq(shiftReports.productionDate, input.productionDate),
        eq(shiftReports.shift, input.shift)
      )
    )
    .limit(1);

  if (existing) {
    return { ok: true, reportId: existing.id };
  }

  const cleanForeman = input.foremanName.trim() || session.name;

  const [created] = await db
    .insert(shiftReports)
    .values({
      productionDate: input.productionDate,
      shift: input.shift,
      foremanId: session.id,
      foremanName: cleanForeman,
      status: 'EN_CURSO',
      gasConsumption: 0,
      dispatchedTons: 0,
      blackEarthTrips: 0,
      redEarthTrips: 0,
      notes: '',
      closedAt: null,
    })
    .returning();

  await db.insert(auditLogs).values({
    userId: session.id,
    userName: session.name,
    action: 'OPEN_SHIFT',
    entity: 'SHIFT_REPORT',
    details: `Apertura de Turno ${input.shift} | Fecha ${input.productionDate} | Capataz: ${cleanForeman}`,
  });

  revalidatePath('/capataz');
  revalidatePath('/dashboard');
  revalidatePath('/estadisticas');

  return { ok: true, reportId: created.id };
}

export async function saveShiftReportAction(input: {
  productionDate: string;
  shift: ShiftType;
  foremanName: string;
  status: ShiftStatusType;
  gasConsumption: number;
  dispatchedTons: number;
  blackEarthTrips: number;
  redEarthTrips: number;
  notes: string;
  entries: {
    stage: ProductionStageType;
    brickTypeId: number;
    quantity: number;
  }[];
}): Promise<{ ok: boolean; error?: string; reportId?: number }> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: 'Debes iniciar sesión para guardar el parte.' };
  }

  if (!canEditProductionStages(session.role)) {
    return {
      ok: false,
      error: 'No tienes permisos para modificar las etapas de producción del capataz.',
    };
  }

  const [existing] = await db
    .select()
    .from(shiftReports)
    .where(
      and(
        eq(shiftReports.productionDate, input.productionDate),
        eq(shiftReports.shift, input.shift)
      )
    )
    .limit(1);

  if (
    existing &&
    (existing.status === 'CERRADO' || existing.status === 'AUDITADO') &&
    !canEditAnyShift(session.role)
  ) {
    return {
      ok: false,
      error:
        'Este turno ya fue cerrado y no se puede modificar. El único que puede modificar un turno cerrado es el Administrador.',
    };
  }

  const allBricks = await db.select().from(brickTypes);
  const brickMap = new Map(allBricks.map((b) => [b.id, b]));

  // Solo quien tiene permiso de suministros (o ADMIN) actualiza Salida, Gas y Tierra;
  // el Capataz preserva los valores existentes para no pisar la carga de la otra persona.
  const userCanEditSupplies = canEditSupplies(session.role);
  const cleanGas = userCanEditSupplies
    ? Math.max(0, Number(input.gasConsumption) || 0)
    : existing?.gasConsumption ?? 0;
  const cleanTons = userCanEditSupplies
    ? Math.max(0, Number(input.dispatchedTons) || 0)
    : existing?.dispatchedTons ?? 0;
  const cleanBlack = userCanEditSupplies
    ? Math.max(0, Math.round(Number(input.blackEarthTrips) || 0))
    : existing?.blackEarthTrips ?? 0;
  const cleanRed = userCanEditSupplies
    ? Math.max(0, Math.round(Number(input.redEarthTrips) || 0))
    : existing?.redEarthTrips ?? 0;

  let reportId: number;

  if (existing) {
    await db
      .update(shiftReports)
      .set({
        foremanName: input.foremanName.trim() || session.name,
        status: input.status,
        gasConsumption: cleanGas,
        dispatchedTons: cleanTons,
        blackEarthTrips: cleanBlack,
        redEarthTrips: cleanRed,
        notes: input.notes.trim(),
        closedAt: input.status === 'CERRADO' ? new Date() : existing.closedAt,
        updatedAt: new Date(),
      })
      .where(eq(shiftReports.id, existing.id));

    reportId = existing.id;
    await db.delete(shiftStageEntries).where(eq(shiftStageEntries.shiftReportId, reportId));
  } else {
    const [created] = await db
      .insert(shiftReports)
      .values({
        productionDate: input.productionDate,
        shift: input.shift,
        foremanId: session.id,
        foremanName: input.foremanName.trim() || session.name,
        status: input.status,
        gasConsumption: cleanGas,
        dispatchedTons: cleanTons,
        blackEarthTrips: cleanBlack,
        redEarthTrips: cleanRed,
        notes: input.notes.trim(),
        closedAt: input.status === 'CERRADO' ? new Date() : null,
      })
      .returning();

    reportId = created.id;
  }

  const validEntries = input.entries.filter((e) => Number(e.quantity) > 0 && e.brickTypeId > 0);

  if (validEntries.length > 0) {
    const rowsToInsert = validEntries.map((e) => {
      const brick = brickMap.get(e.brickTypeId) || allBricks[0];
      const isWagon = WAGON_STAGES.includes(e.stage);
      const factor = isWagon ? brick.unitsPerWagon : brick.unitsPerBench;
      const qty = Math.max(0, Number(e.quantity) || 0);
      const estimatedUnits = Math.round(qty * factor);
      const estimatedTons = Number(((estimatedUnits * brick.unitWeightKg) / 1000).toFixed(2));

      return {
        shiftReportId: reportId,
        stage: e.stage,
        brickTypeId: brick.id,
        quantity: qty,
        estimatedUnits,
        estimatedTons,
      };
    });

    await db.insert(shiftStageEntries).values(rowsToInsert);
  }

  await db.insert(auditLogs).values({
    userId: session.id,
    userName: session.name,
    action: input.status === 'CERRADO' ? 'CLOSE_SHIFT' : 'SAVE_SHIFT',
    entity: 'SHIFT_REPORT',
    details: `Fecha ${input.productionDate} | Turno ${input.shift} (${input.status})`,
  });

  revalidatePath('/capataz');
  revalidatePath('/dashboard');
  revalidatePath('/estadisticas');

  return { ok: true, reportId };
}

export async function saveSuppliesReportAction(input: {
  productionDate: string;
  shift: ShiftType;
  gasConsumption: number;
  dispatchedTons: number;
  blackEarthTrips: number;
  redEarthTrips: number;
}): Promise<{ ok: boolean; error?: string; reportId?: number }> {
  const session = await getSession();
  if (!session || !canEditSupplies(session.role)) {
    return {
      ok: false,
      error:
        'No tienes permisos para cargar Salida de Material, Consumo de Gas y Viajes de Tierra.',
    };
  }

  const cleanGas = Math.max(0, Number(input.gasConsumption) || 0);
  const cleanTons = Math.max(0, Number(input.dispatchedTons) || 0);
  const cleanBlack = Math.max(0, Math.round(Number(input.blackEarthTrips) || 0));
  const cleanRed = Math.max(0, Math.round(Number(input.redEarthTrips) || 0));

  const [existing] = await db
    .select()
    .from(shiftReports)
    .where(
      and(
        eq(shiftReports.productionDate, input.productionDate),
        eq(shiftReports.shift, input.shift)
      )
    )
    .limit(1);

  let reportId: number;

  if (existing) {
    await db
      .update(shiftReports)
      .set({
        gasConsumption: cleanGas,
        dispatchedTons: cleanTons,
        blackEarthTrips: cleanBlack,
        redEarthTrips: cleanRed,
        updatedAt: new Date(),
      })
      .where(eq(shiftReports.id, existing.id));
    reportId = existing.id;
  } else {
    const [created] = await db
      .insert(shiftReports)
      .values({
        productionDate: input.productionDate,
        shift: input.shift,
        foremanId: null,
        foremanName: 'Pendiente de apertura por Capataz',
        status: 'EN_CURSO',
        gasConsumption: cleanGas,
        dispatchedTons: cleanTons,
        blackEarthTrips: cleanBlack,
        redEarthTrips: cleanRed,
        notes: '',
      })
      .returning();
    reportId = created.id;
  }

  await db.insert(auditLogs).values({
    userId: session.id,
    userName: session.name,
    action: 'SAVE_SUPPLIES',
    entity: 'SHIFT_SUPPLIES',
    details: `Fecha ${input.productionDate} | Turno ${input.shift} | Salida: ${cleanTons} tn, Gas: ${cleanGas} m³, Tierra N/R: ${cleanBlack}/${cleanRed}`,
  });

  revalidatePath('/capataz');
  revalidatePath('/dashboard');
  revalidatePath('/estadisticas');

  return { ok: true, reportId };
}

export async function reopenShiftReportAction(reportId: number): Promise<{
  ok: boolean;
  error?: string;
}> {
  const session = await getSession();
  if (!session || !canEditAnyShift(session.role)) {
    return {
      ok: false,
      error: 'El único que puede reabrir o modificar un turno cerrado es el Administrador.',
    };
  }

  await db
    .update(shiftReports)
    .set({ status: 'EN_CURSO', updatedAt: new Date() })
    .where(eq(shiftReports.id, reportId));

  await db.insert(auditLogs).values({
    userId: session.id,
    userName: session.name,
    action: 'REOPEN_SHIFT',
    entity: 'SHIFT_REPORT',
    details: `Reapertura de parte ID #${reportId} por Administrador`,
  });

  revalidatePath('/capataz');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function getRangeComparisonData(startDate: string, endDate: string) {
  let reports = await db
    .select()
    .from(shiftReports)
    .where(
      and(
        gte(shiftReports.productionDate, startDate),
        lte(shiftReports.productionDate, endDate),
        inArray(shiftReports.shift, ['MANANA', 'TARDE'])
      )
    )
    .orderBy(asc(shiftReports.productionDate), asc(shiftReports.shift));

  // Si no hay reportes y la tabla está vacía en la base de datos, sembrar automáticamente
  if (reports.length === 0) {
    try {
      const totalReports = await db.select({ count: sql<number>`count(*)` }).from(shiftReports);
      if (Number(totalReports[0]?.count || 0) === 0) {
        const { ensureDatabaseSeeded } = await import('@/db/autoSeed');
        const seeded = await ensureDatabaseSeeded();
        if (seeded) {
          reports = await db
            .select()
            .from(shiftReports)
            .where(
              and(
                gte(shiftReports.productionDate, startDate),
                lte(shiftReports.productionDate, endDate),
                inArray(shiftReports.shift, ['MANANA', 'TARDE'])
              )
            )
            .orderBy(asc(shiftReports.productionDate), asc(shiftReports.shift));
        }
      }
    } catch (err) {
      console.warn('Auto-seed range check fallback warning:', err);
    }
  }

  const reportIds = reports.map((r) => r.id);
  const entries =
    reportIds.length > 0
      ? await db
          .select()
          .from(shiftStageEntries)
          .where(inArray(shiftStageEntries.shiftReportId, reportIds))
      : [];

  const bricks = await db.select().from(brickTypes);
  const brickMap = new Map(bricks.map((b) => [b.id, b]));

  const daysMap = new Map<
    string,
    {
      date: string;
      extrusoraBenches: number;
      secaderoBenches: number;
      cargaManualBenches: number;
      cargaRobotBenches: number;
      hornoCargadasWagons: number;
      hornoFueraWagons: number;
      descargaWagons: number;
      gasManana: number;
      gasTarde: number;
      gasNoche: number;
      totalGas: number;
      dispatchedTons: number;
      blackEarthTrips: number;
      redEarthTrips: number;
      firedTons: number;
      extrudedUnits: number;
    }
  >();

  for (const rep of reports) {
    if (!daysMap.has(rep.productionDate)) {
      daysMap.set(rep.productionDate, {
        date: rep.productionDate,
        extrusoraBenches: 0,
        secaderoBenches: 0,
        cargaManualBenches: 0,
        cargaRobotBenches: 0,
        hornoCargadasWagons: 0,
        hornoFueraWagons: 0,
        descargaWagons: 0,
        gasManana: 0,
        gasTarde: 0,
        gasNoche: 0,
        totalGas: 0,
        dispatchedTons: 0,
        blackEarthTrips: 0,
        redEarthTrips: 0,
        firedTons: 0,
        extrudedUnits: 0,
      });
    }

    const day = daysMap.get(rep.productionDate)!;
    if (rep.shift === 'MANANA') day.gasManana = rep.gasConsumption;
    if (rep.shift === 'TARDE') day.gasTarde = rep.gasConsumption;
    if (rep.shift === 'NOCHE') day.gasNoche = rep.gasConsumption;
    day.totalGas = Number((day.gasManana + day.gasTarde + day.gasNoche).toFixed(1));
    day.dispatchedTons = Number((day.dispatchedTons + rep.dispatchedTons).toFixed(1));
    day.blackEarthTrips += rep.blackEarthTrips;
    day.redEarthTrips += rep.redEarthTrips;

    const repEntries = entries.filter((e) => e.shiftReportId === rep.id);
    for (const e of repEntries) {
      if (e.stage === 'EXTRUSORA') {
        day.extrusoraBenches += e.quantity;
        day.extrudedUnits += e.estimatedUnits;
      } else if (e.stage === 'SECADERO') {
        day.secaderoBenches += e.quantity;
      } else if (e.stage === 'CARGA_MANUAL') {
        day.cargaManualBenches += e.quantity;
      } else if (e.stage === 'CARGA_ROBOT') {
        day.cargaRobotBenches += e.quantity;
      } else if (e.stage === 'HORNO_CARGADAS') {
        day.hornoCargadasWagons += e.quantity;
      } else if (e.stage === 'HORNO_FUERA') {
        day.hornoFueraWagons += e.quantity;
        day.firedTons = Number((day.firedTons + e.estimatedTons).toFixed(1));
      } else if (e.stage === 'DESCARGA') {
        day.descargaWagons += e.quantity;
      }
    }
  }

  const recentLogs = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(15);

  return {
    days: Array.from(daysMap.values()),
    bricks: Array.from(brickMap.values()),
    recentLogs,
  };
}

export async function seedDemoDataAction(): Promise<{ ok: boolean; message: string }> {
  try {
    const { runAutoSeed } = await import('@/db/autoSeed');
    const result = await runAutoSeed();
    revalidatePath('/dashboard');
    revalidatePath('/estadisticas');
    return { ok: result.success, message: result.message };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Error al inicializar datos de prueba.',
    };
  }
}


