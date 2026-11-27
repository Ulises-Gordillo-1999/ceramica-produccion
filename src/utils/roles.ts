import type { RoleType, ShiftType } from '@/db/schema';

export type { RoleType, ShiftType };

export const SESSION_COOKIE_NAME = 'ceramica_session';

/**
 * Turnos operativos activos de la planta (Mañana y Tarde).
 * Se mantiene 'NOCHE' en el enum de base de datos por compatibilidad de esquema PostgreSQL.
 */
export const ACTIVE_SHIFTS: ShiftType[] = ['MANANA', 'TARDE'];

export interface SessionUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: RoleType;
  defaultShift: ShiftType;
}

export const ROLE_LABELS: Record<RoleType, string> = {
  ADMIN: 'Administrador General',
  DIRECTORIO: 'Directorio / Dueños',
  INGENIERO_ENCARGADO: 'Encargado (Gas, Tierra y Salida)',
  CAPATAZ: 'Capataz de Turno',
};

export const SHIFT_LABELS: Record<ShiftType, string> = {
  MANANA: 'MAÑANA',
  TARDE: 'TARDE',
  NOCHE: 'NOCHE',
};

/**
 * El Administrador es el ÚNICO rol que puede modificar o reabrir un turno ya cerrado.
 */
export function canEditAnyShift(role: RoleType): boolean {
  return role === 'ADMIN';
}

/**
 * Determina quién puede cargar las 5 etapas productivas del turno (Extrusora, Secadero, Carga, Horno, Descarga).
 */
export function canEditProductionStages(role: RoleType): boolean {
  return role === 'CAPATAZ' || role === 'ADMIN';
}

/**
 * Determina quién puede cargar Salida de Material, Consumo de Gas y Viajes de Tierra.
 */
export function canEditSupplies(role: RoleType): boolean {
  return role === 'INGENIERO_ENCARGADO' || role === 'ADMIN';
}

export function canManageUsers(role: RoleType): boolean {
  return role === 'ADMIN';
}

export function canManageCatalog(role: RoleType): boolean {
  return role === 'ADMIN';
}
