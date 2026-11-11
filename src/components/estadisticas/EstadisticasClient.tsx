'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart3,
  FileDown,
  Flame,
  Cpu,
  TrendingUp,
  ArrowLeftRight,
  History,
} from 'lucide-react';

interface DayMetric {
  date: string;
  extrusoraBenches: number;
  secaderoBenches: number;
  cargaManualBenches: number;
  cargaRobotBenches: number;
  hornoCargadasWagons: number;
  hornoFueraWagons: number;
  descargaWagons: number;
  gasManana: number;
  gasTarde: number;
  gasNoche: number;
  totalGas: number;
  dispatchedTons: number;
  blackEarthTrips: number;
  redEarthTrips: number;
  firedTons: number;
  extrudedUnits: number;
}

interface AuditEntry {
  id: number;
  userName: string;
  action: string;
  details: string;
  createdAt: Date;
}

export function EstadisticasClient({
  startDate,
  endDate,
  days,
  recentLogs,
}: {
  startDate: string;
  endDate: string;
  days: DayMetric[];
  recentLogs: AuditEntry[];
}) {
  const router = useRouter();
  const [fromDate, setFromDate] = useState(startDate);
  const [toDate, setToDate] = useState(endDate);

  const lastIdx = Math.max(0, days.length - 1);
  const prevIdx = Math.max(0, days.length - 2);
  const [dayA, setDayA] = useState(days[prevIdx]?.date || startDate);
  const [dayB, setDayB] = useState(days[lastIdx]?.date || endDate);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/estadisticas?from=${fromDate}&to=${toDate}`);
  };

  // Totales acumulados del periodo
  const periodTotals = days.reduce(
    (acc, d) => {
      acc.extrusora += d.extrusoraBenches;
      acc.secadero += d.secaderoBenches;
      acc.manual += d.cargaManualBenches;
      acc.robot += d.cargaRobotBenches;
      acc.hornoIn += d.hornoCargadasWagons;
      acc.hornoOut += d.hornoFueraWagons;
      acc.descarga += d.descargaWagons;
      acc.gas += d.totalGas;
      acc.dispatchedTons += d.dispatchedTons;
      acc.firedTons += d.firedTons;
      acc.blackTrips += d.blackEarthTrips;
      acc.redTrips += d.redEarthTrips;
      acc.units += d.extrudedUnits;
      return acc;
    },
    {
      extrusora: 0,
      secadero: 0,
      manual: 0,
      robot: 0,
      hornoIn: 0,
      hornoOut: 0,
      descarga: 0,
      gas: 0,
      dispatchedTons: 0,
      firedTons: 0,
      blackTrips: 0,
      redTrips: 0,
      units: 0,
    }
  );

  const totalCarga = periodTotals.manual + periodTotals.robot;
  const robotSharePct =
    totalCarga > 0 ? Math.round((periodTotals.robot / totalCarga) * 100) : 0;
  const gasPerWagon =
    periodTotals.hornoOut > 0
      ? Number((periodTotals.gas / periodTotals.hornoOut).toFixed(1))
      : 0;
  const gasPerFiredTon =
    periodTotals.firedTons > 0
      ? Number((periodTotals.gas / periodTotals.firedTons).toFixed(1))
      : 0;

  const maxExtrusora = Math.max(...days.map((d) => d.extrusoraBenches), 1);

  const dataDayA = days.find((d) => d.date === dayA);
  const dataDayB = days.find((d) => d.date === dayB);

  const exportRangePdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, 297, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `ESTADÍSTICAS Y COMPARATIVA DE PRODUCCIÓN (${startDate} a ${endDate})`,
      14,
      14
    );

    autoTable(doc, {
      startY: 30,
      head: [
        [
          'Fecha',
          'Extrusora (Bancos)',
          'Secadero (Bancos)',
          'Carga Manual',
          'Carga Robot',
          'Horno Cargadas',
          'Horno Fuera',
          'Descarga (Zorras)',
          'Gas Total (m³)',
          'Salida (Tn)',
          'Tierra (N/R)',
        ],
      ],
      body: days.map((d) => [
        d.date,
        d.extrusoraBenches,
        d.secaderoBenches,
        d.cargaManualBenches,
        d.cargaRobotBenches,
        d.hornoCargadasWagons,
        d.hornoFueraWagons,
        d.descargaWagons,
        `${d.totalGas.toLocaleString('es-AR')} m³`,
        `${d.dispatchedTons.toFixed(1)} tn`,
        `${d.blackEarthTrips} / ${d.redEarthTrips}`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [217, 119, 6] },
      styles: { fontSize: 8.5 },
    });

    doc.save(`estadisticas-produccion-${startDate}-a-${endDate}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera y Filtro de Rango de Fechas */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Inteligencia de Planta & Ingeniería
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">
            Estadísticas, Comparativas y Reportes
          </h1>
        </div>

        <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800 px-3 py-2 rounded-xl text-xs font-bold">
            <span className="text-slate-500">Desde:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-sm font-bold focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800 px-3 py-2 rounded-xl text-xs font-bold">
            <span className="text-slate-500">Hasta:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-sm font-bold focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white min-h-[42px] cursor-pointer"
          >
            Filtrar Rango
          </button>
          <button
            type="button"
            onClick={exportRangePdf}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 min-h-[42px] cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Exportar PDF</span>
          </button>
        </form>
      </div>

      {/* KPIs de Ingeniería Industrial */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-extrabold uppercase">Ladrillos Extruidos</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold">
            {periodTotals.units.toLocaleString('es-AR')} u.
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            En {periodTotals.extrusora} bancos moldeados
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-extrabold uppercase">Automatización (Robot)</span>
            <Cpu className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold">{robotSharePct}% Robot</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Robot: {periodTotals.robot} bancos vs. Manual: {periodTotals.manual}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-orange-600 dark:text-orange-400">
            <span className="text-xs font-extrabold uppercase">Rendimiento Térmico Gas</span>
            <Flame className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold">{gasPerWagon} m³ / zorra</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            ≈ {gasPerFiredTon} m³ por tonelada cocida
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-xs font-extrabold uppercase">Cocción vs. Despacho</span>
            <BarChart3 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold">
            {periodTotals.dispatchedTons.toFixed(1)} tn salidas
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {periodTotals.hornoOut} zorras cocidas ({periodTotals.firedTons.toFixed(1)} tn)
          </p>
        </div>
      </div>

      {/* Comparador Directo entre 2 Días (Día A vs. Día B) */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-extrabold">
                Comparador Directo entre Dos Fechas
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Selecciona dos días para contrastar su producción etapa por etapa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={dayA}
              onChange={(e) => setDayA(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
            >
              {days.map((d) => (
                <option key={d.date} value={d.date}>
                  Día A: {d.date}
                </option>
              ))}
            </select>
            <span className="text-xs font-bold text-slate-400">vs.</span>
            <select
              value={dayB}
              onChange={(e) => setDayB(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
            >
              {days.map((d) => (
                <option key={d.date} value={d.date}>
                  Día B: {d.date}
                </option>
              ))}
            </select>
          </div>
        </div>

        {dataDayA && dataDayB ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              {
                label: 'Extrusora (Bancos)',
                a: dataDayA.extrusoraBenches,
                b: dataDayB.extrusoraBenches,
              },
              {
                label: 'Secadero (Bancos)',
                a: dataDayA.secaderoBenches,
                b: dataDayB.secaderoBenches,
              },
              {
                label: 'Carga Robot',
                a: dataDayA.cargaRobotBenches,
                b: dataDayB.cargaRobotBenches,
              },
              {
                label: 'Horno Cargadas',
                a: dataDayA.hornoCargadasWagons,
                b: dataDayB.hornoCargadasWagons,
              },
              {
                label: 'Horno Fuera',
                a: dataDayA.hornoFueraWagons,
                b: dataDayB.hornoFueraWagons,
              },
              {
                label: 'Descarga (Zorras)',
                a: dataDayA.descargaWagons,
                b: dataDayB.descargaWagons,
              },
              {
                label: 'Salida (Toneladas)',
                a: dataDayA.dispatchedTons,
                b: dataDayB.dispatchedTons,
              },
            ].map((item) => {
              const diff = Number((item.b - item.a).toFixed(1));
              return (
                <div
                  key={item.label}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 space-y-1"
                >
                  <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                    {item.label}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">{item.a}</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-zinc-100">
                      {item.b}
                    </span>
                  </div>
                  <span
                    className={`inline-block text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                      diff > 0
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : diff < 0
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        : 'bg-slate-200 dark:bg-zinc-800 text-slate-500'
                    }`}
                  >
                    {diff > 0 ? `+${diff}` : diff === 0 ? 'Igual' : diff}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Selecciona fechas con registros dentro del rango para comparar.
          </p>
        )}
      </div>

      {/* Evolución Visual Diaria + Tabla Histórica */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider">
            Evolución Diaria: Bancos Extruidos vs. Zorras Cocidas
          </h3>

          <div className="space-y-3">
            {days.map((d) => {
              const pct = Math.min(100, Math.round((d.extrusoraBenches / maxExtrusora) * 100));
              return (
                <div key={d.date} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-zinc-200">
                      {d.date}
                    </span>
                    <span className="text-slate-500 dark:text-zinc-400">
                      Extrusora: <strong>{d.extrusoraBenches} bancos</strong> • Horno Fuera:{' '}
                      <strong>{d.hornoFueraWagons} zorras</strong> • Salida:{' '}
                      <strong>{d.dispatchedTons} tn</strong>
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Registro de Actividad en Vivo (Auditoría) */}
        <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">
              Bitácora de Planta
            </h3>
          </div>
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/70 dark:border-zinc-800 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-zinc-200">
                  <span>{log.userName}</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400">
                    {log.action}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-zinc-400 mt-0.5">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
