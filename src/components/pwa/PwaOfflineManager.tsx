'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function PwaOfflineManager() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // 1. Registrar Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registrado con éxito:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Error al registrar Service Worker:', err);
        });
    }

    // 2. Monitorear estado de conexión
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-50 max-w-md animate-in slide-in-from-bottom duration-200">
      {!isOnline ? (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500 text-slate-950 shadow-2xl font-bold text-xs sm:text-sm border-2 border-amber-400">
          <WifiOff className="w-5 h-5 shrink-0 animate-pulse" />
          <div className="min-w-0">
            <p className="leading-tight">Modo Sin Conexión Activo</p>
            <p className="text-[11px] font-medium opacity-90">
              Baja señal en planta. Puedes seguir cargando y se guardará en tu teléfono.
            </p>
          </div>
        </div>
      ) : showReconnected ? (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-600 text-white shadow-2xl font-bold text-xs sm:text-sm border-2 border-emerald-500">
          <Wifi className="w-5 h-5 shrink-0" />
          <span>¡Conexión restablecida! Sincronizando con planta...</span>
        </div>
      ) : null}
    </div>
  );
}

