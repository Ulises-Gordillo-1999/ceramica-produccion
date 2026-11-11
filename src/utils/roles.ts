import type { RoleType, ShiftType } from '@/db/schema';

export const SESSION_COOKIE_NAME = 'ceramica_session';

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
  INGENIERO_ENCARGADO: 'Ingeniero / Encargado',
  CAPATAZ: 'Capataz de Turno',
};

export const SHIFT_LABELS: Record<ShiftType, string> = {
  MANANA: 'MAÑANA',
  TARDE: 'TARDE',
  NOCHE: 'NOCHE',
};

export function canEditAnyShift(role: RoleType): boolean {
  return role === 'ADMIN' || role === 'INGENIERO_ENCARGADO';
}

export function canManageUsers(role: RoleType): boolean {
  return role === 'ADMIN';
}

export function canManageCatalog(role: RoleType): boolean {
  return role === 'ADMIN' || role === 'INGENIERO_ENCARGADO';
}

