'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Flame,
  Fingerprint,
  Lock,
  User,
  ArrowRight,
  HardHat,
  BarChart3,
  Shield,
  Wrench,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { loginAction, loginWithPasskeyAction } from '@/app/actions/auth';
import { getStoredBiometricInfo, verifyBiometricPasskey } from '@/utils/biometrics';

const QUICK_PROFILES = [
  {
    username: 'capataz.manana',
    label: 'Roberto Gómez (Capataz)',
    sub: 'Rol Capataz • Turno Rotativo (Mañana / Tarde)',
    icon: HardHat,
    color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  {
    username: 'capataz.tarde',
    label: 'Carlos Díaz (Capataz)',
    sub: 'Rol Capataz • Turno Rotativo (Mañana / Tarde)',
    icon: HardHat,
    color: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  {
    username: 'encargado',
    label: 'Encargado (Salida, Gas y Tierra)',
    sub: 'Visualiza capataz y carga Salida, Gas y Tierra',
    icon: Wrench,
    color: 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  },
  {
    username: 'directorio',
    label: 'Dueños / Directorio',
    sub: 'Dashboard en Vivo y Reportes PDF',
    icon: BarChart3,
    color: 'border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300',
  },
  {
    username: 'admin',
    label: 'Administrador General',
    sub: 'Control Total + Único que modifica turnos cerrados',
    icon: Shield,
    color: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  },
];

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bioUser, setBioUser] = useState<string | null>(null);
  const passwordInputRef = React.useRef<HTMLInputElement>(null);

  const router = useRouter();

  useEffect(() => {
    const info = getStoredBiometricInfo();
    if (info.credentialId) {
      setBioUser(info.userLabel || 'Usuario vinculado');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await loginAction({ identifier, password });
      if (!res.ok) {
        setError(res.error || 'Error al iniciar sesión.');
      } else {
        router.push(res.redirectTo || '/dashboard');
        router.refresh();
      }
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickProfile = (username: string) => {
    setIdentifier(username);
    setPassword('');
    setError(null);
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { credentialId } = await verifyBiometricPasskey();
      const res = await loginWithPasskeyAction({ credentialId });
      if (res.ok) {
        router.push(res.redirectTo || '/dashboard');
        router.refresh();
      } else {
        setError(res.error || 'Huella no reconocida.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo validar la huella digital.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-between bg-slate-50 dark:bg-zinc-950 p-4 sm:p-6">
      <div className="flex items-center justify-between max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight block leading-none">
              CERÁMICA PRODUCCIÓN
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Sistema Industrial PWA
            </span>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md mx-auto my-6">
        <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-zinc-100">
              Ingreso a Planta
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              Carga de partes por turno y monitoreo en tiempo real
            </p>
          </div>

          {/* Botón Primario de Huella Digital (WebAuthn) */}
          <button
            type="button"
            onClick={handleBiometricLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 transition-all min-h-[52px] cursor-pointer disabled:opacity-50"
          >
            <Fingerprint className="w-6 h-6 shrink-0" />
            <div className="text-left">
              <span className="block leading-tight">Ingresar con Huella Digital</span>
              <span className="block text-[11px] font-normal text-emerald-100">
                {bioUser ? `Vinculado a: ${bioUser}` : 'Acceso rápido biométrico (PWA)'}
              </span>
            </div>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-zinc-800" />
            <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-zinc-500">
              o con tu usuario
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-zinc-800" />
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1.5">
                Usuario o Correo
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ej. capataz.manana o admin"
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-base bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[48px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={passwordInputRef}
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-base bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[48px]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-md shadow-amber-600/20 transition-all min-h-[48px] cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Ingresando...' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Selector Rápido de Perfiles para Pruebas */}
          <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 text-center">
              Seleccionar Rol (Autocompleta el usuario — luego ingresa la clave)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_PROFILES.map((prof) => {
                const Icon = prof.icon;
                return (
                  <button
                    key={prof.username}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickProfile(prof.username)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all hover:scale-[1.01] cursor-pointer ${prof.color}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{prof.label}</p>
                      <p className="text-[10px] opacity-80 truncate">{prof.sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-400 dark:text-zinc-600">
        Cerámica Producción ERP • Optimizado para Celular, Tablet y PC
      </footer>
    </div>
  );
}

