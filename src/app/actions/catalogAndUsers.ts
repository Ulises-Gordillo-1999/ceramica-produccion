'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { eq, asc } from 'drizzle-orm';
import { db } from '@/db';
import {
  brickTypes,
  users,
  auditLogs,
  type RoleType,
  type ShiftType,
} from '@/db/schema';
import { getSession, canManageCatalog, canManageUsers } from '@/utils/auth';

export async function getBricksCatalogAction() {
  return await db
    .select()
    .from(brickTypes)
    .orderBy(asc(brickTypes.sortOrder), asc(brickTypes.id));
}

export async function saveBrickTypeAction(input: {
  id?: number;
  code: string;
  name: string;
  dimensions: string;
  unitsPerBench: number;
  unitsPerWagon: number;
  unitWeightKg: number;
  isActive: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session || !canManageCatalog(session.role)) {
    return { ok: false, error: 'No tienes permisos para administrar el catálogo.' };
  }

  const code = input.code.trim().toUpperCase();
  const name = input.name.trim();
  const dimensions = input.dimensions.trim();

  if (!code || !name) {
    return { ok: false, error: 'El código y el nombre del ladrillo son obligatorios.' };
  }

  if (input.id) {
    await db
      .update(brickTypes)
      .set({
        code,
        name,
        dimensions,
        unitsPerBench: Math.max(1, Math.round(Number(input.unitsPerBench) || 400)),
        unitsPerWagon: Math.max(1, Math.round(Number(input.unitsPerWagon) || 1200)),
        unitWeightKg: Math.max(0.1, Number(input.unitWeightKg) || 4.0),
        isActive: input.isActive,
      })
      .where(eq(brickTypes.id, input.id));
  } else {
    await db.insert(brickTypes).values({
      code,
      name,
      dimensions: dimensions || 'Estándar',
      unitsPerBench: Math.max(1, Math.round(Number(input.unitsPerBench) || 400)),
      unitsPerWagon: Math.max(1, Math.round(Number(input.unitsPerWagon) || 1200)),
      unitWeightKg: Math.max(0.1, Number(input.unitWeightKg) || 4.0),
      isActive: input.isActive,
    });
  }

  await db.insert(auditLogs).values({
    userId: session.id,
    userName: session.name,
    action: input.id ? 'UPDATE_BRICK' : 'CREATE_BRICK',
    entity: 'BRICK_CATALOG',
    details: `${code} - ${name}`,
  });

  revalidatePath('/catalogo');
  revalidatePath('/capataz');
  revalidatePath('/dashboard');

  return { ok: true };
}

export async function getUsersListAction() {
  const all = await db.select().from(users).orderBy(asc(users.id));
  return all.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    role: u.role,
    defaultShift: u.defaultShift || 'MANANA',
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function saveUserAction(input: {
  id?: number;
  name: string;
  username: string;
  email: string;
  password?: string;
  role: RoleType;
  defaultShift: ShiftType;
  isActive: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session || !canManageUsers(session.role)) {
    return { ok: false, error: 'Solo el Administrador General puede gestionar usuarios y roles.' };
  }

  const name = input.name.trim();
  const username = input.username.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();

  if (!name || !username || !email) {
    return { ok: false, error: 'Completa nombre, usuario y correo electrónico.' };
  }

  if (input.id) {
    const updatePayload: Partial<typeof users.$inferInsert> = {
      name,
      username,
      email,
      role: input.role,
      defaultShift: input.defaultShift,
      isActive: input.isActive,
    };

    if (input.password && input.password.trim().length >= 6) {
      updatePayload.passwordHash = await bcrypt.hash(input.password.trim(), 10);
    }

    await db.update(users).set(updatePayload).where(eq(users.id, input.id));
  } else {
    const rawPass =
      input.password && input.password.trim().length >= 6
        ? input.password.trim()
        : 'Ceramica2026!';
    const passwordHash = await bcrypt.hash(rawPass, 10);

    await db.insert(users).values({
      name,
      username,
      email,
      passwordHash,
      role: input.role,
      defaultShift: input.defaultShift,
      isActive: input.isActive,
    });
  }

  await db.insert(auditLogs).values({
    userId: session.id,
    userName: session.name,
    action: input.id ? 'UPDATE_USER' : 'CREATE_USER',
    entity: 'USER_RBAC',
    details: `${name} (${username}) -> Rol ${input.role}`,
  });

  revalidatePath('/usuarios');
  return { ok: true };
}

