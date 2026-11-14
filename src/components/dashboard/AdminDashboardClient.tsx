'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileDown,
  Flame,
  Truck,
  Mountain,
  Edit3,
  BarChart3,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LayoutGrid,
  Table,
} from 'lucide-react';
import type { DailyProductionSummary } from '@/app/actions/production';
import type { ProductionStageType, ShiftType } from '@/db/schema';
import { SHIFT_LABELS, canEditAnyShift, type SessionUser } from '@/utils/roles';
import { exportDailyProductionPdf } from '@/utils/pdfReport';
import { formatDateDMY } from '@/utils/dates';

function addDays(dateStr: string, offset: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + offset);
  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, '0');
  const nd = String(dt.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

function getRecent7Days(centerDate: string): { date: string; shortLabel: string }[] {
  const days: { date: string; shortLabel: string }[] = [];
  const names = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  for (let i = -5; i <= 1; i++) {
    const dStr = addDays(centerDate, i);
    const [y, m, d] = dStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    days.push({
      date: dStr,
      shortLabel: `${names[dt.getDay()]} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`,
    });
  }
  return days;
}

const MATRIX_ROWS: {
  stage: ProductionStageType;
  section: string;
  label: string;
  unit: string;
  badgeColor: string;
}[] = [
  {
    stage: 'EXTRUSORA',
    section: 'EXTRUSORA',
    label: 'Cantidad de Bancos',
    unit: 'bancos',
    badgeColor: 'bg-emerald-600 text-white',
  },
  {
    stage: 'SECADERO',
    section: 'SECADERO',
    label: 'Cantidad de Banco',
    unit: 'bancos',
    badgeColor: 'bg-amber-500 text-slate-950',
  },
  {
    stage: 'CARGA_MANUAL',
    section: 'CARGA DE BANCO',
    label: 'Carga Manual',
    unit: 'bancos',
    badgeColor: 'bg-amber-800 text-white',
  },
  {
    stage: 'CARGA_ROBOT',
    section: 'CARGA DE BANCO',
    label: 'Carga Robot',
    unit: 'bancos',
    badgeColor: 'bg-amber-800 text-white',
  },
  {
    stage: 'HORNO_CARGADAS',
    section: 'HORNO',
    label: 'Zorras Cargadas',
    unit: 'zorras',
    badgeColor: 'bg-red-600 text-white',
  },
  {
    stage: 'HORNO_FUERA',
    section: 'HORNO',
    label: 'Zorras Fuera (Cocidas)',
    unit: 'zorras',
    badgeColor: 'bg-red-600 text-white',
  },
  {
    stage: 'DESCARGA',
    section: 'DESCARGA',
    label: 'Cantidad de Zorras',
    unit: 'zorras',
    badgeColor: 'bg-slate-600 text-white',
  },
];

export function AdminDashboardClient({
  user,
  summary,
}: {
  user: SessionUser;
  summary: DailyProductionSummary;
}) {
  const router = useRouter();
  const [liveSync, setLiveSync] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileTableView, setMobileTableView] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    if (!liveSync) return;
    const timer = setInterval(() => {
      router.refresh();
    }, 15000);
    return () => clearInterval(timer);
  }, [liveSync, router]);

  const handleDateChange = (newDate: string) => {
    if (!newDate) return;
    router.push(`/dashboard?date=${newDate}`);
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const quickDays = getRecent7Days(summary.date);
  const loadedShiftsCount = (['MANANA', 'TARDE', 'NOCHE'] as ShiftType[]).filter(
    (s) => summary.shifts[s] !== null
  ).length;

  const renderStageBadges = (shift: ShiftType, stage: ProductionStageType) => {
    const rep = summary.shifts[shift];
    if (!rep) {
      return <span className="text-xs text-slate-400 dark:text-zinc-600">—</span>;
    }
    const entries = rep.entries.filter((e) => e.stage === stage);
    if (entries.length === 0) {
      return <span className="text-xs font-semibold text-slate-400">0</span>;
    }
    return (
      <div className="flex flex-wrap gap-1.5">
        {entries.map((entry, idx) => (
          <div
            key={`${entry.stage}_${idx}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
          >
            <span className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">
              {entry.quantity}
            </span>
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-lime-500/20 text-lime-800 dark:text-lime-300">
              {entry.brickCode}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Ejecutiva + Barra de Navegación Temporal */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Tiempo Real ({loadedShiftsCount}/3 turnos registrados)
              </span>
              <button
                type="button"
                onClick={() => setLiveSync((v) => !v)}
                className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 hover:underline cursor-pointer"
              >
                {liveSync ? 'Auto-sync: ON (15s)' : 'Auto-sync: OFF'}
              </button>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100 mt-1">
              Centro de Control de Producción
            </h1>
          </div>

          {/* Controles de Fecha y Exportación PDF */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/90 p-1 rounded-xl border border-slate-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => handleDateChange(addDays(summary.date, -1))}
                title="Día Anterior"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-white dark:bg-zinc-900 hover:bg-amber-500/10 text-slate-700 dark:text-zinc-200 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center px-2">
                <Calendar className="w-4 h-4 text-amber-500 mr-1.5" />
                <input
                  type="date"
                  value={summary.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="bg-transparent font-bold text-sm sm:text-base text-slate-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
                />
              </div>
              <button
                type="button"
                onClick={() => handleDateChange(addDays(summary.date, 1))}
                title="Día Siguiente"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-white dark:bg-zinc-900 hover:bg-amber-500/10 text-slate-700 dark:text-zinc-200 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleManualRefresh}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 min-h-[44px] cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>

            <button
              type="button"
              onClick={() => exportDailyProductionPdf(summary)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-sm min-h-[44px] cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>

        {/* Tira Rápida de Navegación por Días */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-slate-200/70 dark:border-zinc-800">
          {quickDays.map((d) => {
            const active = d.date === summary.date;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => handleDateChange(d.date)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer min-h-[40px] ${
                  active
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-zinc-800/70 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
                }`}
              >
                {d.shortLabel}
              </button>
            );
          })}
          <Link
            href="/estadisticas"
            className="ml-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0 min-h-[40px]"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Comparar Fechas / Estadísticas</span>
          </Link>
        </div>
      </div>

      {/* 6 Tarjetas KPI del Día */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border-l-4 border-l-emerald-600 border border-slate-200 dark:border-zinc-800 shadow-2xs">
          <p className="text-[11px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
            1. Extrusora
          </p>
          <p className="text-2xl font-extrabold mt-1">
            {summary.totals.extrusoraBenches}{' '}
            <span className="text-xs font-semibold text-slate-500">bancos</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            ≈ {summary.totals.estimatedExtrudedUnits.toLocaleString('es-AR')} ladrillos
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border-l-4 border-l-amber-500 border border-slate-200 dark:border-zinc-800 shadow-2xs">
          <p className="text-[11px] font-extrabold uppercase text-amber-600 dark:text-amber-400">
            2. Secadero
          </p>
          <p className="text-2xl font-extrabold mt-1">
            {summary.totals.secaderoBenches}{' '}
            <span className="text-xs font-semibold text-slate-500">bancos</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            En cámaras de secado
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border-l-4 border-l-amber-800 border border-slate-200 dark:border-zinc-800 shadow-2xs">
          <p className="text-[11px] font-extrabold uppercase text-amber-700 dark:text-amber-500">
            3. Carga Banco
          </p>
          <p className="text-2xl font-extrabold mt-1">
            {summary.totals.cargaManualBenches + summary.totals.cargaRobotBenches}{' '}
            <span className="text-xs font-semibold text-slate-500">bancos</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Robot: {summary.totals.cargaRobotBenches} | Manual: {summary.totals.cargaManualBenches}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border-l-4 border-l-red-600 border border-slate-200 dark:border-zinc-800 shadow-2xs">
          <p className="text-[11px] font-extrabold uppercase text-red-600 dark:text-red-400">
            4. Horno (Fuera)
          </p>
          <p className="text-2xl font-extrabold mt-1">
            {summary.totals.hornoFueraWagons}{' '}
            <span className="text-xs font-semibold text-slate-500">zorras</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Cargadas: {summary.totals.hornoCargadasWagons} ({summary.totals.estimatedFiredTons} tn)
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border-l-4 border-l-slate-500 border border-slate-200 dark:border-zinc-800 shadow-2xs">
          <p className="text-[11px] font-extrabold uppercase text-slate-600 dark:text-zinc-400">
            5. Descarga / Salida
          </p>
          <p className="text-2xl font-extrabold mt-1">
            {summary.totals.descargaWagons}{' '}
            <span className="text-xs font-semibold text-slate-500">zorras</span>
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
            Salida: {summary.totals.dispatchedTons} Toneladas
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border-l-4 border-l-orange-500 border border-slate-200 dark:border-zinc-800 shadow-2xs">
          <p className="text-[11px] font-extrabold uppercase text-orange-600 dark:text-orange-400">
            Gas y Tierra
          </p>
          <p className="text-2xl font-extrabold mt-1">
            {summary.totals.totalGas.toLocaleString('es-AR')}{' '}
            <span className="text-xs font-semibold text-slate-500">m³</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Tierra N: {summary.totals.blackEarthTrips} | R: {summary.totals.redEarthTrips}
          </p>
        </div>
      </div>

      {/* Grilla Central: Matriz de los 3 Turnos (8 cols) + Bloque Derecho Salida/Gas/Tierra (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* BLOQUE IZQUIERDO: MATRIZ DE LOS 3 TURNOS */}
        <div className="xl:col-span-8 space-y-4">
          {/* Tarjetas de Estado de cada Turno y su Capataz */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['MANANA', 'TARDE', 'NOCHE'] as ShiftType[]).map((sh) => {
              const rep = summary.shifts[sh];
              return (
                <div
                  key={sh}
                  className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        TURNO {SHIFT_LABELS[sh]}
                      </span>
                      {rep ? (
                        rep.status === 'EN_CURSO' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            <Clock className="w-3 h-3" /> En Curso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> Cerrado
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500">
                          <AlertTriangle className="w-3 h-3" /> Pendiente
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1 truncate">
                      {rep ? rep.foremanName : 'Sin capataz registrado'}
                    </p>
                    {rep?.notes && (
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        &ldquo;{rep.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {canEditAnyShift(user.role) && (
                    <Link
                      href={`/capataz?date=${summary.date}&shift=${sh}`}
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-amber-500/15 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{rep ? 'Auditar / Editar Turno' : 'Cargar Turno'}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tabla Sinóptica por Etapa Productiva (Diseño Híbrido Mobile Cards + Desktop Table) */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider">
                  Planilla Consolidada ({formatDateDMY(summary.date)})
                </h2>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 hidden lg:inline">
                  Cantidad + Código de Ladrillo
                </span>

                {/* Switch de visualización en móvil */}
                <div className="flex md:hidden items-center bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setMobileTableView('cards')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all ${
                      mobileTableView === 'cards'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Tarjetas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileTableView('table')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all ${
                      mobileTableView === 'table'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Tabla</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Vista 1: Tarjetas Optimizadas para Celular (< md) */}
            {mobileTableView === 'cards' && (
              <div className="md:hidden divide-y divide-slate-100 dark:divide-zinc-800/80">
                {MATRIX_ROWS.map((row) => {
                  let rowTotal = 0;
                  if (row.stage === 'EXTRUSORA') rowTotal = summary.totals.extrusoraBenches;
                  if (row.stage === 'SECADERO') rowTotal = summary.totals.secaderoBenches;
                  if (row.stage === 'CARGA_MANUAL') rowTotal = summary.totals.cargaManualBenches;
                  if (row.stage === 'CARGA_ROBOT') rowTotal = summary.totals.cargaRobotBenches;
                  if (row.stage === 'HORNO_CARGADAS') rowTotal = summary.totals.hornoCargadasWagons;
                  if (row.stage === 'HORNO_FUERA') rowTotal = summary.totals.hornoFueraWagons;
                  if (row.stage === 'DESCARGA') rowTotal = summary.totals.descargaWagons;

                  return (
                    <div key={row.stage} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${row.badgeColor}`}
                          >
                            {row.section}
                          </span>
                          <span className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">
                            {row.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-500 dark:text-zinc-400 mr-1">Total:</span>
                          <span className="font-black text-sm text-slate-900 dark:text-zinc-100">
                            {rowTotal}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 ml-1">
                            {row.unit}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800/60">
                          <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 mb-1">
                            MAÑANA
                          </div>
                          <div className="min-h-[24px] flex items-center justify-center">
                            {renderStageBadges('MANANA', row.stage)}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800/60">
                          <div className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 mb-1">
                            TARDE
                          </div>
                          <div className="min-h-[24px] flex items-center justify-center">
                            {renderStageBadges('TARDE', row.stage)}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800/60">
                          <div className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">
                            NOCHE
                          </div>
                          <div className="min-h-[24px] flex items-center justify-center">
                            {renderStageBadges('NOCHE', row.stage)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Vista 2: Tabla Consolidada (Siempre en Desktop, o en móvil si el usuario la activa) */}
            <div className={`overflow-x-auto ${mobileTableView === 'cards' ? 'hidden md:block' : 'block'}`}>
              <table className="min-w-[680px] w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 text-[11px] font-extrabold uppercase text-slate-500 dark:text-zinc-400">
                    <th className="py-3 px-4 sticky left-0 z-20 bg-slate-50 dark:bg-zinc-950 border-r border-slate-200/70 dark:border-zinc-800 shadow-2xs">
                      Sector / Etapa
                    </th>
                    <th className="py-3 px-4">Turno Mañana</th>
                    <th className="py-3 px-4">Turno Tarde</th>
                    <th className="py-3 px-4">Turno Noche</th>
                    <th className="py-3 px-4 text-right">Total Día</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-zinc-800 text-sm">
                  {MATRIX_ROWS.map((row) => {
                    let rowTotal = 0;
                    if (row.stage === 'EXTRUSORA') rowTotal = summary.totals.extrusoraBenches;
                    if (row.stage === 'SECADERO') rowTotal = summary.totals.secaderoBenches;
                    if (row.stage === 'CARGA_MANUAL') rowTotal = summary.totals.cargaManualBenches;
                    if (row.stage === 'CARGA_ROBOT') rowTotal = summary.totals.cargaRobotBenches;
                    if (row.stage === 'HORNO_CARGADAS') rowTotal = summary.totals.hornoCargadasWagons;
                    if (row.stage === 'HORNO_FUERA') rowTotal = summary.totals.hornoFueraWagons;
                    if (row.stage === 'DESCARGA') rowTotal = summary.totals.descargaWagons;

                    return (
                      <tr
                        key={row.stage}
                        className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 sticky left-0 z-10 bg-white dark:bg-zinc-900 border-r border-slate-100 dark:border-zinc-800 shadow-2xs">
                          <span
                            className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded mb-1 ${row.badgeColor}`}
                          >
                            {row.section}
                          </span>
                          <div className="font-bold text-slate-900 dark:text-zinc-100 text-xs sm:text-sm">
                            {row.label}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {renderStageBadges('MANANA', row.stage)}
                        </td>
                        <td className="py-3.5 px-4">
                          {renderStageBadges('TARDE', row.stage)}
                        </td>
                        <td className="py-3.5 px-4">
                          {renderStageBadges('NOCHE', row.stage)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 dark:text-zinc-100">
                          {rowTotal}{' '}
                          <span className="text-xs font-normal text-slate-500">
                            {row.unit}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* BLOQUE DERECHO: RÉPLICA DEL PANEL DERECHO DE LA PLANILLA */}
        <div className="xl:col-span-4 space-y-4">
          {/* SALIDA MATERIAL */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-200 dark:bg-zinc-800 font-extrabold text-sm uppercase tracking-wider flex items-center justify-between">
              <span>SALIDA MATERIAL</span>
              <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-slate-600 dark:text-zinc-400">
                TONELADAS DEL DÍA
              </span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100">
                {summary.totals.dispatchedTons} tn
              </span>
            </div>
          </div>

          {/* CONSUMO DE GAS */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-200 dark:bg-zinc-800 font-extrabold text-sm uppercase tracking-wider flex items-center justify-between">
              <span>CONSUMO DE GAS</span>
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div className="p-4 space-y-3 divide-y divide-slate-200/70 dark:divide-zinc-800">
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-extrabold uppercase text-slate-700 dark:text-zinc-300">
                  TURNO MAÑANA
                </span>
                <span className="text-base font-extrabold">
                  {summary.totals.gasManana.toLocaleString('es-AR')} m³
                </span>
              </div>
              <div className="flex items-center justify-between pt-3">
                <span className="text-xs font-extrabold uppercase text-slate-700 dark:text-zinc-300">
                  TURNO TARDE
                </span>
                <span className="text-base font-extrabold">
                  {summary.totals.gasTarde.toLocaleString('es-AR')} m³
                </span>
              </div>
              <div className="flex items-center justify-between pt-3">
                <span className="text-xs font-extrabold uppercase text-slate-700 dark:text-zinc-300">
                  TURNO NOCHE
                </span>
                <span className="text-base font-extrabold">
                  {summary.totals.gasNoche.toLocaleString('es-AR')} m³
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 text-amber-600 dark:text-amber-400">
                <span className="text-xs font-extrabold uppercase">TOTAL GAS DÍA</span>
                <span className="text-lg font-extrabold">
                  {summary.totals.totalGas.toLocaleString('es-AR')} m³
                </span>
              </div>
            </div>
          </div>

          {/* VIAJES TIERRA */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-200 dark:bg-zinc-800 font-extrabold text-sm uppercase tracking-wider flex items-center justify-between">
              <span>VIAJES TIERRA</span>
              <Mountain className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="p-4 space-y-3 divide-y divide-slate-200/70 dark:divide-zinc-800">
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-extrabold uppercase text-slate-700 dark:text-zinc-300">
                  VIAJES NEGRA
                </span>
                <span className="text-lg font-extrabold">
                  {summary.totals.blackEarthTrips} viajes
                </span>
              </div>
              <div className="flex items-center justify-between pt-3">
                <span className="text-xs font-extrabold uppercase text-slate-700 dark:text-zinc-300">
                  VIAJES ROJA
                </span>
                <span className="text-lg font-extrabold">
                  {summary.totals.redEarthTrips} viajes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
