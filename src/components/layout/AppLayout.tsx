'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  ClipboardList,
  Activity,
  BarChart3,
  Layers,
  Users,
  Fingerprint,
  LogOut,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Flame,
  BookOpen,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Modal } from '@/components/ui/Modal';
import { ROLE_LABELS, SHIFT_LABELS, type SessionUser } from '@/utils/roles';
import { logoutAction, registerPasskeyAction } from '@/app/actions/auth';
import { exportUserManualPdf } from '@/utils/pdfReport';
import {
  createBiometricPasskey,
  getStoredBiometricInfo,
  clearStoredBiometricInfo,
} from '@/utils/biometrics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function AppLayout({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bioModalOpen, setBioModalOpen] = useState(false);
  const [bioStatus, setBioStatus] = useState<{ linked: boolean; label: string | null }>({
    linked: false,
    label: null,
  });
  const [bioLoading, setBioLoading] = useState(false);
  const [bioFeedback, setBioFeedback] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const info = getStoredBiometricInfo();
    setBioStatus({ linked: Boolean(info.credentialId), label: info.userLabel });

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const navItems = [
    {
      href: '/capataz',
      label: 'Planilla de Turno',
      badge: 'Capataz',
      icon: ClipboardList,
      roles: ['CAPATAZ', 'INGENIERO_ENCARGADO', 'ADMIN'],
    },
    {
      href: '/dashboard',
      label: 'Dashboard en Vivo',
      badge: 'Planta',
      icon: Activity,
      roles: ['DIRECTORIO', 'INGENIERO_ENCARGADO', 'ADMIN'],
    },
    {
      href: '/estadisticas',
      label: 'Comparativas y PDF',
      badge: 'KPIs',
      icon: BarChart3,
      roles: ['DIRECTORIO', 'INGENIERO_ENCARGADO', 'ADMIN'],
    },
    {
      href: '/catalogo',
      label: 'Catálogo Ladrillos',
      badge: 'Medidas',
      icon: Layers,
      roles: ['INGENIERO_ENCARGADO', 'ADMIN'],
    },
    {
      href: '/usuarios',
      label: 'Usuarios y Roles',
      badge: 'RBAC',
      icon: Users,
      roles: ['ADMIN'],
    },
  ].filter((item) => item.roles.includes(user.role));

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
    router.refresh();
  };

  const handleActivateBiometrics = async () => {
    setBioLoading(true);
    setBioFeedback(null);
    try {
      const cred = await createBiometricPasskey({
        id: user.id,
        username: user.username,
        name: user.name,
      });
      const res = await registerPasskeyAction(cred);
      if (res.ok) {
        setBioStatus({ linked: true, label: user.name });
        setBioFeedback(
          '¡Huella digital vinculada! Ahora puedes iniciar sesión con un solo toque desde la pantalla de ingreso.'
        );
      } else {
        setBioFeedback(res.error || 'No se pudo registrar la huella.');
      }
    } catch (err) {
      setBioFeedback(err instanceof Error ? err.message : 'Error al activar huella.');
    } finally {
      setBioLoading(false);
    }
  };

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const renderSidebarContent = () => (
    <>
      <div className="flex items-center justify-between px-2 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight block leading-none text-slate-900 dark:text-zinc-100">
              CERÁMICA
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Control de Planta
            </span>
          </div>
        </div>
        <div className="hidden lg:block">
          <ThemeToggle />
        </div>
      </div>

      {/* Tarjeta de Usuario y Rol */}
      <div className="mb-5 p-3.5 rounded-2xl bg-slate-100/90 dark:bg-zinc-800/70 border border-slate-200/80 dark:border-zinc-700/60">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
            {user.name}
          </p>
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
            {SHIFT_LABELS[user.defaultShift]}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">{ROLE_LABELS[user.role]}</span>
        </p>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all min-h-[46px] ${
                active
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/20'
                  : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/70 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                }`}
              >
                {item.badge}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Acciones Rápidas: PWA + Huella Digital + Salir */}
      <div className="pt-4 mt-4 border-t border-slate-200 dark:border-zinc-800 space-y-2">
        {deferredPrompt && (
          <button
            type="button"
            onClick={handleInstallPwa}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors min-h-[44px] cursor-pointer"
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>Instalar App en Celular (PWA)</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => exportUserManualPdf()}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors min-h-[44px] cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Manual de Usuario (PDF)</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20">
            Descargar
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setBioFeedback(null);
            setBioModalOpen(true);
          }}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800/90 text-slate-700 dark:text-zinc-200 hover:bg-slate-200/70 dark:hover:bg-zinc-800 transition-colors min-h-[44px] cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <Fingerprint className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Acceso con Huella</span>
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              bioStatus.linked
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
            }`}
          >
            {bioStatus.linked ? 'Activa' : 'Configurar'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors min-h-[44px] cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-dvh bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 overflow-hidden">
      {/* 1. Sidebar Fijo en Desktop (lg+) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 border-r border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/95 p-4 shrink-0">
        {renderSidebarContent()}
      </aside>

      {/* 2. Backdrop y Drawer Off-Canvas en Mobile/Tablet (< lg) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 p-4 flex flex-col transform transition-transform duration-200 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-end mb-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
            className="flex items-center justify-center w-11 h-11 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {renderSidebarContent()}
      </aside>

      {/* 3. Contenedor Principal + Topbar Móvil */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-4 h-16 border-b border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md lg:hidden shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú de navegación"
            className="flex items-center justify-center w-11 h-11 -ml-1 rounded-xl text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white">
              <Flame className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm tracking-tight">CERÁMICA PROD</span>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Modal de Biometría (Huella Digital / FaceID) y PWA */}
      <Modal
        isOpen={bioModalOpen}
        onClose={() => setBioModalOpen(false)}
        title="Acceso Biométrico (Huella / FaceID)"
        subtitle="Vincula el lector de huella de tu celular para entrar en 1 segundo sin contraseña"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3.5">
            <Fingerprint className="w-8 h-8 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 space-y-1">
              <p className="font-bold text-slate-900 dark:text-zinc-100">
                Estándar WebAuthn / Passkey
              </p>
              <p>
                Al activar tu huella en este teléfono o tablet, la próxima vez que abras la PWA podrás ingresar tocando{' '}
                <strong>&ldquo;Ingresar con Huella&rdquo;</strong> con el sensor biométrico del equipo.
              </p>
            </div>
          </div>

          {bioStatus.linked && (
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                    Huella activa en este dispositivo
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Usuario vinculado: {bioStatus.label || user.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearStoredBiometricInfo();
                  setBioStatus({ linked: false, label: null });
                  setBioFeedback('Huella desvinculada de este dispositivo.');
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
              >
                Desvincular
              </button>
            </div>
          )}

          {bioFeedback && (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-medium text-amber-800 dark:text-amber-300">
              {bioFeedback}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              disabled={bioLoading}
              onClick={handleActivateBiometrics}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 min-h-[48px] cursor-pointer disabled:opacity-50"
            >
              <Fingerprint className="w-5 h-5" />
              <span>
                {bioLoading
                  ? 'Verificando sensor...'
                  : bioStatus.linked
                  ? 'Actualizar Huella en este Equipo'
                  : 'Activar Huella Digital Ahora'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setBioModalOpen(false)}
              className="px-4 py-3 rounded-xl font-semibold text-sm bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 min-h-[48px] cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
