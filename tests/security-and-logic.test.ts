import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import {
  signSessionToken,
  verifySessionToken,
  type SessionUser,
} from '../src/utils/jwt';
import {
  ACTIVE_SHIFTS,
  canEditAnyShift,
  canEditProductionStages,
  canEditSupplies,
  canManageUsers,
  canManageCatalog,
} from '../src/utils/roles';

describe('🔒 1. Suite de Seguridad Criptográfica y Tokens JWT', () => {
  const dummyUser: SessionUser = {
    id: 101,
    name: 'Operario Test',
    username: 'operario.test',
    email: 'operario@test.com',
    role: 'CAPATAZ',
    defaultShift: 'MANANA',
  };

  test('Debe firmar y verificar un token JWT válido de sesión', async () => {
    const token = await signSessionToken(dummyUser);
    assert.ok(typeof token === 'string' && token.length > 20);

    const decoded = await verifySessionToken(token);
    assert.ok(decoded !== null);
    assert.equal(decoded.id, dummyUser.id);
    assert.equal(decoded.username, dummyUser.username);
    assert.equal(decoded.role, dummyUser.role);
    assert.equal(decoded.defaultShift, dummyUser.defaultShift);
  });

  test('Debe rechazar tokens falsificados o con firma manipulada', async () => {
    const token = await signSessionToken(dummyUser);
    // Alterar el payload o firma del token
    const tampered = token.slice(0, -6) + 'XXXXXX';
    const decoded = await verifySessionToken(tampered);
    assert.equal(decoded, null, 'Un token manipulado debe retornar null');
  });

  test('Debe rechazar tokens vacíos o strings corruptos', async () => {
    assert.equal(await verifySessionToken(''), null);
    assert.equal(await verifySessionToken('invalid.token.structure'), null);
  });
});

describe('🛡️ 2. Suite de Control de Acceso Basado en Roles (RBAC)', () => {
  test('ACTIVE_SHIFTS: El sistema opera exclusivamente con 2 turnos (MAÑANA y TARDE)', () => {
    assert.deepEqual(ACTIVE_SHIFTS, ['MANANA', 'TARDE']);
  });

  test('canEditAnyShift: Únicamente el ADMIN puede modificar o reabrir turnos cerrados', () => {
    assert.equal(canEditAnyShift('ADMIN'), true);
    assert.equal(canEditAnyShift('INGENIERO_ENCARGADO'), false);
    assert.equal(canEditAnyShift('CAPATAZ'), false, 'El capataz no puede editar un turno cerrado');
    assert.equal(canEditAnyShift('DIRECTORIO'), false, 'El directorio es solo lectura de partes');
  });

  test('canEditProductionStages: Solo CAPATAZ y ADMIN pueden cargar las 5 etapas productivas', () => {
    assert.equal(canEditProductionStages('CAPATAZ'), true);
    assert.equal(canEditProductionStages('ADMIN'), true);
    assert.equal(canEditProductionStages('INGENIERO_ENCARGADO'), false);
    assert.equal(canEditProductionStages('DIRECTORIO'), false);
  });

  test('canEditSupplies: Solo el encargado designado y ADMIN cargan Salida, Gas y Viajes de Tierra', () => {
    assert.equal(canEditSupplies('INGENIERO_ENCARGADO'), true);
    assert.equal(canEditSupplies('ADMIN'), true);
    assert.equal(canEditSupplies('CAPATAZ'), false);
    assert.equal(canEditSupplies('DIRECTORIO'), false);
  });

  test('canManageUsers: Únicamente ADMIN puede administrar usuarios', () => {
    assert.equal(canManageUsers('ADMIN'), true);
    assert.equal(canManageUsers('INGENIERO_ENCARGADO'), false);
    assert.equal(canManageUsers('CAPATAZ'), false);
    assert.equal(canManageUsers('DIRECTORIO'), false);
  });

  test('canManageCatalog: Únicamente ADMIN puede gestionar el catálogo de ladrillos', () => {
    assert.equal(canManageCatalog('ADMIN'), true);
    assert.equal(canManageCatalog('INGENIERO_ENCARGADO'), false);
    assert.equal(canManageCatalog('CAPATAZ'), false);
    assert.equal(canManageCatalog('DIRECTORIO'), false);
  });
});

describe('🔑 3. Suite de Hasheo y Almacenamiento Seguro de Contraseñas', () => {
  test('bcryptjs: Las contraseñas deben estar salteadas y hasheadas unidireccionalmente', async () => {
    const rawPass = 'CeramicaPlanta2026!';
    const hash = await bcrypt.hash(rawPass, 10);

    assert.notEqual(hash, rawPass);
    assert.ok(hash.startsWith('$2'), 'El hash debe tener formato bcrypt');

    const isValid = await bcrypt.compare(rawPass, hash);
    assert.equal(isValid, true, 'La contraseña correcta debe validar');

    const isInvalid = await bcrypt.compare('WrongPassword123!', hash);
    assert.equal(isInvalid, false, 'Una contraseña errónea debe ser rechazada');
  });
});

describe('📐 4. Suite de Lógica Matemática y Conversiones Industriales', () => {
  const mockBrick = {
    code: 'H12',
    name: 'Hueco 12x18x33',
    unitsPerBench: 480,
    unitsPerWagon: 1440,
    unitWeightKg: 4.2,
  };

  test('Conversión de Bancos a Unidades y Toneladas (Extrusora / Secadero)', () => {
    const bancos = 40;
    const estimatedUnits = Math.round(bancos * mockBrick.unitsPerBench);
    const estimatedTons = Number(((estimatedUnits * mockBrick.unitWeightKg) / 1000).toFixed(2));

    assert.equal(estimatedUnits, 19200, '40 bancos x 480 deben ser 19.200 ladrillos');
    assert.equal(estimatedTons, 80.64, '19.200 x 4.2kg / 1000 debe ser 80.64 tn');
  });

  test('Conversión de Zorras a Unidades y Toneladas (Horno / Descarga)', () => {
    const zorras = 14;
    const estimatedUnits = Math.round(zorras * mockBrick.unitsPerWagon);
    const estimatedTons = Number(((estimatedUnits * mockBrick.unitWeightKg) / 1000).toFixed(2));

    assert.equal(estimatedUnits, 20160, '14 zorras x 1440 deben ser 20.160 ladrillos');
    assert.equal(estimatedTons, 84.67, '20.160 x 4.2kg / 1000 debe ser 84.67 tn');
  });

  test('Rendimiento Térmico de Gas (m³ de gas / zorras cocidas)', () => {
    const gasTotal = 4720;
    const zorrasCocidas = 13;
    const ratio = Number((gasTotal / zorrasCocidas).toFixed(1));

    assert.equal(ratio, 363.1, '4720 m³ / 13 zorras debe dar 363.1 m³/zorra');
  });

  test('Manejo seguro contra inputs negativos o nulos', () => {
    const negativeQty = -15;
    const safeQty = Math.max(0, Number(negativeQty) || 0);
    assert.equal(safeQty, 0, 'Valores negativos deben normalizarse a 0');

    const nanQty = Number('invalido');
    const safeNan = Math.max(0, nanQty || 0);
    assert.equal(safeNan, 0, 'Valores NaN deben normalizarse a 0');
  });
});

