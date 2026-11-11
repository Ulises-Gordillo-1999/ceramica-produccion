'use server';

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { eq, or } from 'drizzle-orm';
import { db } from '@/db';
import { users, userPasskeys, auditLogs } from '@/db/schema';
import {
  SESSION_COOKIE_NAME,
  signSessionToken,
  getSession,
  type SessionUser,
} from '@/utils/auth';

async function setUserCookie(sessionUser: SessionUser) {
  const token = await signSessionToken(sessionUser);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
}

export async function loginAction(formData: {
  identifier: string;
  password: string;
}): Promise<{ ok: boolean; error?: string; redirectTo?: string; user?: SessionUser }> {
  const identifier = formData.identifier.trim().toLowerCase();
  const password = formData.password;

  if (!identifier || !password) {
    return { ok: false, error: 'Ingresa tu usuario y contraseña.' };
  }

  const [found] = await db
    .select()
    .from(users)
    .where(or(eq(users.username, identifier), eq(users.email, identifier)))
    .limit(1);

  if (!found || !found.isActive) {
    return { ok: false, error: 'Usuario no encontrado o cuenta desactivada.' };
  }

  const valid = await bcrypt.compare(password, found.passwordHash);
  if (!valid) {
    return { ok: false, error: 'Contraseña incorrecta.' };
  }

  const sessionUser: SessionUser = {
    id: found.id,
    name: found.name,
    username: found.username,
    email: found.email,
    role: found.role,
    defaultShift: found.defaultShift || 'MANANA',
  };

  await setUserCookie(sessionUser);

  await db.insert(auditLogs).values({
    userId: found.id,
    userName: found.name,
    action: 'LOGIN',
    entity: 'AUTH',
    details: `Inicio de sesión (${found.role})`,
  });

  const redirectTo = found.role === 'CAPATAZ' ? '/capataz' : '/dashboard';
  return { ok: true, redirectTo, user: sessionUser };
}

export async function logoutAction(): Promise<{ ok: boolean }> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return { ok: true };
}

export async function registerPasskeyAction(input: {
  credentialId: string;
  publicKey: string;
  deviceName: string;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: 'Sesión no válida.' };
  }

  await db
    .insert(userPasskeys)
    .values({
      userId: session.id,
      credentialId: input.credentialId,
      publicKey: input.publicKey,
      deviceName: input.deviceName || 'Dispositivo Móvil (Huella / Biometría)',
    })
    .onConflictDoNothing();

  await db.insert(auditLogs).values({
    userId: session.id,
    userName: session.name,
    action: 'REGISTER_BIOMETRIC',
    entity: 'PASSKEY',
    details: `Vinculación de huella digital en ${input.deviceName}`,
  });

  return { ok: true };
}

export async function loginWithPasskeyAction(input: {
  credentialId: string;
}): Promise<{ ok: boolean; error?: string; redirectTo?: string }> {
  if (!input.credentialId) {
    return { ok: false, error: 'Credencial biométrica no recibida.' };
  }

  const [passkey] = await db
    .select()
    .from(userPasskeys)
    .where(eq(userPasskeys.credentialId, input.credentialId))
    .limit(1);

  if (!passkey) {
    return {
      ok: false,
      error:
        'Esta huella aún no está vinculada. Ingresa con tu usuario y actívala desde el botón "Huella Digital" en la barra lateral.',
    };
  }

  const [found] = await db
    .select()
    .from(users)
    .where(eq(users.id, passkey.userId))
    .limit(1);

  if (!found || !found.isActive) {
    return { ok: false, error: 'El usuario asociado a esta huella no está activo.' };
  }

  const sessionUser: SessionUser = {
    id: found.id,
    name: found.name,
    username: found.username,
    email: found.email,
    role: found.role,
    defaultShift: found.defaultShift || 'MANANA',
  };

  await setUserCookie(sessionUser);

  await db.insert(auditLogs).values({
    userId: found.id,
    userName: found.name,
    action: 'LOGIN_BIOMETRIC',
    entity: 'PASSKEY',
    details: `Ingreso con huella biométrica desde ${passkey.deviceName}`,
  });

  const redirectTo = found.role === 'CAPATAZ' ? '/capataz' : '/dashboard';
  return { ok: true, redirectTo };
}

export async function getMyPasskeysAction() {
  const session = await getSession();
  if (!session) return [];
  return await db
    .select()
    .from(userPasskeys)
    .where(eq(userPasskeys.userId, session.id));
}

export async function removePasskeyAction(id: number): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) return { ok: false };
  await db.delete(userPasskeys).where(eq(userPasskeys.id, id));
  return { ok: true };
}
