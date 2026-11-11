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

function formatLocalDate(daysOffset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function seed() {
  console.log('🌱 Iniciando seed de Cerámica Producción...');

  const defaultPass = process.env.SEED_DEFAULT_PASSWORD || 'Ceramica2026!';
  const passwordHash = await bcrypt.hash(defaultPass, 10);

  // 1. Usuarios por rol
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
        name: 'Ing. Martín Pereyra (Encargado)',
        username: 'encargado',
        email: 'encargado@ceramica-planta.com',
        passwordHash,
        role: 'INGENIERO_ENCARGADO',
        defaultShift: 'MANANA',
      },
      {
        name: 'Roberto Gómez (Capataz Mañana)',
        username: 'capataz.manana',
        email: 'manana@ceramica-planta.com',
        passwordHash,
        role: 'CAPATAZ',
        defaultShift: 'MANANA',
      },
      {
        name: 'Carlos Díaz (Capataz Tarde)',
        username: 'capataz.tarde',
        email: 'tarde@ceramica-planta.com',
        passwordHash,
        role: 'CAPATAZ',
        defaultShift: 'TARDE',
      },
      {
        name: 'Miguel Sánchez (Capataz Noche)',
        username: 'capataz.noche',
        email: 'noche@ceramica-planta.com',
        passwordHash,
        role: 'CAPATAZ',
        defaultShift: 'NOCHE',
      },
    ])
    .onConflictDoNothing()
    .returning();

  const allUsers = insertedUsers.length > 0 ? insertedUsers : await db.query.users.findMany();
  const foremanManana = allUsers.find((u) => u.username === 'capataz.manana') || allUsers[0];
  const foremanTarde = allUsers.find((u) => u.username === 'capataz.tarde') || allUsers[0];
  const foremanNoche = allUsers.find((u) => u.username === 'capataz.noche') || allUsers[0];

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

  // 3. Generar 7 días de historial (desde hace 6 días hasta hoy)
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
    {
      shift: 'NOCHE',
      foreman: foremanNoche,
      baseExtrusora: 0, // A menudo extrusora para en noche o hace mantenimiento, pero horno sigue 24hs
      baseSecadero: 18,
      baseManual: 0,
      baseRobot: 24,
      baseHornoIn: 12,
      baseHornoOut: 13,
      baseDescarga: 8,
      baseGas: 4610,
      baseTons: 0,
      blackTrips: 0,
      redTrips: 0,
    },
  ];

  for (let offset = -6; offset <= 0; offset++) {
    const dateStr = formatLocalDate(offset);
    const brickOfDay = offset % 3 === 0 ? h18 : offset % 2 === 0 ? h12 : p18;

    for (const s of shifts) {
      // Para hoy (offset 0), dejamos NOCHE sin crear aún para que se vea un turno pendiente, y TARDE EN_CURSO
      if (offset === 0 && s.shift === 'NOCHE') continue;

      const variance = ((Math.abs(offset) * 3 + (s.shift === 'MANANA' ? 2 : 1)) % 5) - 2;
      const isTodayTarde = offset === 0 && s.shift === 'TARDE';

      const [report] = await db
        .insert(shiftReports)
        .values({
          productionDate: dateStr,
          shift: s.shift,
          foremanId: s.foreman.id,
          foremanName: s.foreman.name,
          status: isTodayTarde ? 'EN_CURSO' : offset < -1 ? 'AUDITADO' : 'CERRADO',
          gasConsumption: Math.max(0, s.baseGas + variance * 90),
          dispatchedTons: s.baseTons > 0 ? Number((s.baseTons + variance * 6.5).toFixed(1)) : 0,
          blackEarthTrips: Math.max(0, s.blackTrips + (variance > 0 ? 1 : 0)),
          redEarthTrips: Math.max(0, s.redTrips + (variance < 0 ? 1 : 0)),
          notes:
            isTodayTarde
              ? 'Turno en curso. Robot operando en ciclo normal.'
              : 'Producción normal sin paradas mecánicas relevantes.',
          closedAt: isTodayTarde ? null : new Date(),
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
    userId: foremanManana.id,
    userName: foremanManana.name,
    action: 'SEED_INIT',
    entity: 'SYSTEM',
    details: 'Inicialización de base de datos con catálogo cerámico y 7 días de partes de turno.',
  });

  console.log('✅ Seed completado exitosamente.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
