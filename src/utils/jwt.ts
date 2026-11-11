import { SignJWT, jwtVerify } from 'jose';
import type { RoleType, ShiftType } from '@/db/schema';
import { SESSION_COOKIE_NAME, type SessionUser } from './roles';

export { SESSION_COOKIE_NAME, type SessionUser };

function getJwtSecretKey(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ||
    'dev_local_jwt_secret_key_ceramica_produccion_2026_safe_32b';
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(user: SessionUser): Promise<string> {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    if (!payload || typeof payload.id !== 'number') return null;
    return {
      id: payload.id as number,
      name: payload.name as string,
      username: payload.username as string,
      email: payload.email as string,
      role: payload.role as RoleType,
      defaultShift: (payload.defaultShift as ShiftType) || 'MANANA',
    };
  } catch {
    return null;
  }
}

