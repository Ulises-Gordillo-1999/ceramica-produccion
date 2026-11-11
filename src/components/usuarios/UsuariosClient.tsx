'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit3, ShieldCheck, UserCheck } from 'lucide-react';
import type { RoleType, ShiftType } from '@/db/schema';
import { ROLE_LABELS, SHIFT_LABELS } from '@/utils/roles';
import { saveUserAction } from '@/app/actions/catalogAndUsers';
import { Modal } from '@/components/ui/Modal';

interface UserRow {
  id: number;
  name: string;
  username: string;
  email: string;
  role: RoleType;
  defaultShift: ShiftType;
  isActive: boolean;
  createdAt: string;
}

const ROLE_DESCRIPTIONS: { role: RoleType; title: string; permissions: string }[] = [
  {
    role: 'CAPATAZ',
    title: 'Capataz de Turno',
    permissions:
      'Acceso exclusivo al formulario móvil de su turno, guardado en vivo y cierre de turno.',
  },
  {
    role: 'INGENIERO_ENCARGADO',
    title: 'Ingeniero / Encargado de Planta',
    permissions:
      'Dashboard en tiempo real, reapertura y corrección de partes de capataces, comparativas y catálogo de ladrillos.',
  },
  {
    role: 'DIRECTORIO',
    title: 'Directorio / Dueños',
    permissions:
      'Monitoreo en tiempo real, navegación histórica por días, comparativas y exportación de reportes PDF.',
  },
  {
    role: 'ADMIN',
    title: 'Administrador General',
    permissions:
      'Control total del sistema, gestión de usuarios, asignación de roles RBAC y auditoría.',
  },
];

export function UsuariosClient({ usersList }: { usersList: UserRow[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RoleType>('CAPATAZ');
  const [defaultShift, setDefaultShift] = useState<ShiftType>('MANANA');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreate = () => {
    setEditingId(undefined);
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('CAPATAZ');
    setDefaultShift('MANANA');
    setIsActive(true);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (u: UserRow) => {
    setEditingId(u.id);
    setName(u.name);
    setUsername(u.username);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
    setDefaultShift(u.defaultShift);
    setIsActive(u.isActive);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await saveUserAction({
        id: editingId,
        name,
        username,
        email,
        password: password || undefined,
        role,
        defaultShift,
        isActive,
      });

      if (res.ok) {
        setModalOpen(false);
        router.refresh();
      } else {
        setError(res.error || 'Error al guardar usuario.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Seguridad y Control de Acceso (RBAC)
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Gestión de Usuarios y Roles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            Administra capataces, ingenieros, encargados y socios con sus alcances de acceso y turno asignado.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-md min-h-[46px] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Matriz de Alcance de Roles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ROLE_DESCRIPTIONS.map((item) => (
          <div
            key={item.role}
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1.5"
          >
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="text-xs font-extrabold uppercase">{item.title}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {item.permissions}
            </p>
          </div>
        ))}
      </div>

      {/* Vista Móvil (< md): Tarjetas */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {usersList.map((u) => (
          <div
            key={u.id}
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3"
          >
            <div className="space-y-1 min-w-0">
              <p className="font-bold text-sm truncate">{u.name}</p>
              <p className="text-xs text-slate-500 truncate">
                @{u.username} • {u.email}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                  {ROLE_LABELS[u.role]}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                  Turno {SHIFT_LABELS[u.defaultShift]}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openEdit(u)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Vista Desktop (md+): Tabla */}
      <div className="hidden md:block rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 text-[11px] font-extrabold uppercase text-slate-500">
              <th className="py-3.5 px-5">Nombre y Apellido</th>
              <th className="py-3.5 px-5">Usuario</th>
              <th className="py-3.5 px-5">Rol Asignado</th>
              <th className="py-3.5 px-5">Turno Habitual</th>
              <th className="py-3.5 px-5">Estado</th>
              <th className="py-3.5 px-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 dark:divide-zinc-800 text-sm">
            {usersList.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40">
                <td className="py-3.5 px-5">
                  <div className="font-bold">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </td>
                <td className="py-3.5 px-5 font-mono text-xs font-bold">@{u.username}</td>
                <td className="py-3.5 px-5">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td className="py-3.5 px-5 font-semibold">
                  {SHIFT_LABELS[u.defaultShift]}
                </td>
                <td className="py-3.5 px-5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      u.isActive
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/15 text-rose-600'
                    }`}
                  >
                    {u.isActive ? 'Activo' : 'Suspendido'}
                  </span>
                </td>
                <td className="py-3.5 px-5 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(u)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-amber-500/15 hover:text-amber-600 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Usuario y Rol' : 'Crear Nuevo Usuario'}
        subtitle="Define sus credenciales, rol RBAC y turno predeterminado"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 text-xs font-bold text-rose-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Roberto Gómez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-base bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-bold min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Usuario de Acceso
              </label>
              <input
                type="text"
                required
                placeholder="Ej. capataz.manana"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-base bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                placeholder="usuario@ceramica-planta.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-base bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Rol en el Sistema
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as RoleType)}
                className="w-full px-3.5 py-2.5 rounded-xl text-base bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-bold min-h-[44px]"
              >
                <option value="CAPATAZ">Capataz de Turno</option>
                <option value="INGENIERO_ENCARGADO">Ingeniero / Encargado</option>
                <option value="DIRECTORIO">Directorio / Dueños</option>
                <option value="ADMIN">Administrador General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Turno Predeterminado
              </label>
              <select
                value={defaultShift}
                onChange={(e) => setDefaultShift(e.target.value as ShiftType)}
                className="w-full px-3.5 py-2.5 rounded-xl text-base bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-bold min-h-[44px]"
              >
                <option value="MANANA">TURNO MAÑANA</option>
                <option value="TARDE">TURNO TARDE</option>
                <option value="NOCHE">TURNO NOCHE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              {editingId
                ? 'Nueva Contraseña (dejar en blanco para mantener actual)'
                : 'Contraseña Inicial'}
            </label>
            <input
              type="password"
              placeholder={editingId ? '••••••••••••' : 'Mínimo 6 caracteres'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-base bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 min-h-[44px]"
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded accent-amber-600"
            />
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span>Usuario habilitado para ingresar a la aplicación</span>
          </label>

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-500 text-white min-h-[48px] cursor-pointer"
            >
              {saving ? 'Guardando...' : 'Guardar Usuario'}
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="py-3 px-4 rounded-xl font-semibold text-sm bg-slate-100 dark:bg-zinc-800 min-h-[48px] cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
