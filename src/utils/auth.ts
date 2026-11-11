import { cookies } from 'next/headers';
import {
  SESSION_COOKIE_NAME,
  ROLE_LABELS,
  SHIFT_LABELS,
  canEditAnyShift,
  canManageUsers,
  canManageCatalog,
  type SessionUser,
} from './roles';
import { signSessionToken, verifySessionToken } from './jwt';

export {
  SESSION_COOKIE_NAME,
  ROLE_LABELS,
  SHIFT_LABELS,
  canEditAnyShift,
  canManageUsers,
  canManageCatalog,
  signSessionToken,
  verifySessionToken,
  type SessionUser,
};

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}
