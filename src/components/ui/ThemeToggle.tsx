'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, ThemeMode } from '@/components/theme/ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/70 h-9 w-[108px]" />
    );
  }

  const options: { value: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'light', label: 'Modo Claro', icon: Sun },
    { value: 'dark', label: 'Modo Oscuro', icon: Moon },
    { value: 'system', label: 'Automático (Sistema)', icon: Monitor },
  ];

  return (
    <div
      role="group"
      aria-label="Selector de tema visual"
      className="inline-flex items-center gap-0.5 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800/90 border border-slate-200/80 dark:border-zinc-700/80"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={active}
            className={`flex items-center justify-center w-8 h-7 rounded-lg transition-all cursor-pointer ${
              active
                ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs font-medium'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
