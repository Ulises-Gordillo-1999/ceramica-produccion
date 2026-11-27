'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle2,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Flame,
  Truck,
  Mountain,
  UserCheck,
  AlertCircle,
  PlayCircle,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import type {
  DailyProductionSummary,
  StageEntryDTO,
} from '@/app/actions/production';
import {
  openShiftReportAction,
  saveShiftReportAction,
  saveSuppliesReportAction,
  reopenShiftReportAction,
} from '@/app/actions/production';
import type { ProductionStageType, ShiftType } from '@/db/schema';
import {
  ACTIVE_SHIFTS,
  SHIFT_LABELS,
  canEditAnyShift,
  canEditProductionStages,
  canEditSupplies,
  type SessionUser,
} from '@/utils/roles';
import { formatDateDMY } from '@/utils/dates';
import { Modal } from '@/components/ui/Modal';

interface StageRowForm {
  key: string;
  stage: ProductionStageType;
  brickTypeId: number;
  quantity: string;
}

const STAGE_SECTIONS: {
  id: string;
  title: string;
  headerBg: string;
  borderClass: string;
  unitLabel: string;
  subStages: { stage: ProductionStageType; label: string }[];
}[] = [
  {
    id: 'extrusora',
    title: 'EXTRUSORA',
    headerBg: 'bg-emerald-700 text-white',
    borderClass: 'border-emerald-600/40',
    unitLabel: 'Bancos',
    subStages: [{ stage: 'EXTRUSORA', label: 'CANTIDAD DE BANCOS' }],
  },
  {
    id: 'secadero',
    title: 'SECADERO',
    headerBg: 'bg-amber-500 text-slate-950',
    borderClass: 'border-amber-500/40',
    unitLabel: 'Bancos',
    subStages: [{ stage: 'SECADERO', label: 'CANTIDAD DE BANCO' }],
  },
  {
    id: 'carga',
    title: 'CARGA DE BANCO',
    headerBg: 'bg-amber-800 text-white',
    borderClass: 'border-amber-800/40',
    unitLabel: 'Bancos',
    subStages: [
      { stage: 'CARGA_MANUAL', label: 'MANUAL' },
      { stage: 'CARGA_ROBOT', label: 'ROBOT' },
    ],
  },
  {
    id: 'horno',
    title: 'HORNO',
    headerBg: 'bg-red-600 text-white',
    borderClass: 'border-red-600/40',
    unitLabel: 'Zorras',
    subStages: [
      { stage: 'HORNO_CARGADAS', label: 'ZORRAS CARGADAS' },
      { stage: 'HORNO_FUERA', label: 'ZORRAS FUERA' },
    ],
  },
  {
    id: 'descarga',
    title: 'DESCARGA',
    headerBg: 'bg-slate-500 text-white',
    borderClass: 'border-slate-500/40',
    unitLabel: 'Zorras',
    subStages: [{ stage: 'DESCARGA', label: 'CANTIDAD DE ZORRAS' }],
  },
];

function addDays(dateStr: string, offset: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + offset);
  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, '0');
  const nd = String(dt.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

export function CapatazSheetClient({
  user,
  initialSummary,
  initialShift,
}: {
  user: SessionUser;
  initialSummary: DailyProductionSummary;
  initialShift: ShiftType;
}) {
  const router = useRouter();
  const [selectedShift, setSelectedShift] = useState<ShiftType>(
    ACTIVE_SHIFTS.includes(initialShift) ? initialShift : 'MANANA'
  );
  const [foremanName, setForemanName] = useState(user.name);
  const [rows, setRows] = useState<StageRowForm[]>([]);
  const [gasConsumption, setGasConsumption] = useState('0');
  const [dispatchedTons, setDispatchedTons] = useState('0');
  const [blackEarthTrips, setBlackEarthTrips] = useState('0');
  const [redEarthTrips, setRedEarthTrips] = useState('0');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const activeBricks = initialSummary.bricks.filter((b) => b.isActive);
  const defaultBrickId = activeBricks[1]?.id || activeBricks[0]?.id || 1;
  const currentReport = initialSummary.shifts[selectedShift];

  const isShiftOpened = Boolean(currentReport);
  const isClosed =
    currentReport?.status === 'CERRADO' || currentReport?.status === 'AUDITADO';

  // Permisos granulares según el rol:
  // - CAPATAZ: Solo edita las 5 etapas productivas cuando el turno está abierto (EN_CURSO). Una vez cerrado, no puede modificar nada.
  // - INGENIERO_ENCARGADO (Persona de Suministros): Visualiza lo que cargó el capataz y solo edita Salida de Material, Consumo de Gas y Viajes de Tierra.
  // - ADMIN: Único rol que puede modificar un turno cerrado, reabrirlo y editar tanto etapas como suministros.
  const isAdmin = canEditAnyShift(user.role);
  const userCanEditStages = canEditProductionStages(user.role);
  const userCanEditSupplies = canEditSupplies(user.role);

  const stagesReadOnly =
    !userCanEditStages || (!isAdmin && (!isShiftOpened || isClosed));

  const suppliesReadOnly = !userCanEditSupplies;

  // Inicializar el formulario al cambiar de turno o de día
  useEffect(() => {
    setFeedback(null);
    const rep = initialSummary.shifts[selectedShift];
    if (rep) {
      setForemanName(rep.foremanName);
      setGasConsumption(String(rep.gasConsumption || 0));
      setDispatchedTons(String(rep.dispatchedTons || 0));
      setBlackEarthTrips(String(rep.blackEarthTrips || 0));
      setRedEarthTrips(String(rep.redEarthTrips || 0));
      setNotes(rep.notes || '');

      const loadedRows: StageRowForm[] = [];
      for (const sec of STAGE_SECTIONS) {
        for (const sub of sec.subStages) {
          const matching = rep.entries.filter((e: StageEntryDTO) => e.stage === sub.stage);
          if (matching.length > 0) {
            matching.forEach((m, idx) => {
              loadedRows.push({
                key: `${sub.stage}_${idx}_${m.id || idx}`,
                stage: sub.stage,
                brickTypeId: m.brickTypeId,
                quantity: String(m.quantity),
              });
            });
          } else {
            loadedRows.push({
              key: `${sub.stage}_0`,
              stage: sub.stage,
              brickTypeId: defaultBrickId,
              quantity: '0',
            });
          }
        }
      }
      setRows(loadedRows);
    } else {
      setForemanName(user.name);
      setGasConsumption('0');
      setDispatchedTons('0');
      setBlackEarthTrips('0');
      setRedEarthTrips('0');
      setNotes('');
      const blankRows: StageRowForm[] = [];
      for (const sec of STAGE_SECTIONS) {
        for (const sub of sec.subStages) {
          blankRows.push({
            key: `${sub.stage}_0`,
            stage: sub.stage,
            brickTypeId: defaultBrickId,
            quantity: '0',
          });
        }
      }
      setRows(blankRows);
    }
  }, [initialSummary, selectedShift, defaultBrickId, user.name]);

  // Sincronización automática de respaldos offline guardados en el celular
  useEffect(() => {
    const syncOfflineData = async () => {
      if (typeof window === 'undefined') return;
      const offlineKey = `ceramica_offline_${initialSummary.date}_${selectedShift}`;
      const saved = localStorage.getItem(offlineKey);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          const res = await saveShiftReportAction({
            productionDate: data.productionDate,
            shift: data.shift,
            foremanName: data.foremanName,
            status: data.status,
            gasConsumption: Number(data.gasConsumption) || 0,
            dispatchedTons: Number(data.dispatchedTons) || 0,
            blackEarthTrips: Number(data.blackEarthTrips) || 0,
            redEarthTrips: Number(data.redEarthTrips) || 0,
            notes: data.notes || '',
            entries: data.rows.map((r: { stage: ProductionStageType; brickTypeId: number; quantity: string }) => ({
              stage: r.stage,
              brickTypeId: r.brickTypeId,
              quantity: Number(r.quantity) || 0,
            })),
          });
          if (res.ok) {
            localStorage.removeItem(offlineKey);
            setFeedback({
              type: 'ok',
              text: '🟢 ¡Conexión restablecida! Los datos guardados en el celular se sincronizaron con éxito en el servidor.',
            });
            router.refresh();
          }
        } catch {
          // Mantener en localStorage para reintentar luego
        }
      }
    };

    window.addEventListener('online', syncOfflineData);
    syncOfflineData();

    return () => {
      window.removeEventListener('online', syncOfflineData);
    };
  }, [initialSummary.date, selectedShift, router]);

  const handleDateChange = (newDate: string) => {
    if (!newDate) return;
    router.push(`/capataz?date=${newDate}&shift=${selectedShift}`);
  };

  const updateRow = (key: string, patch: Partial<StageRowForm>) => {
    if (stagesReadOnly) return;
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const stepQuantity = (key: string, delta: number) => {
    if (stagesReadOnly) return;
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const nextVal = Math.max(0, (Number(r.quantity) || 0) + delta);
        return { ...r, quantity: String(nextVal) };
      })
    );
  };

  const addExtraBrickRow = (stage: ProductionStageType) => {
    if (stagesReadOnly) return;
    setRows((prev) => [
      ...prev,
      {
        key: `${stage}_${Date.now()}`,
        stage,
        brickTypeId: defaultBrickId,
        quantity: '0',
      },
    ]);
  };

  const removeExtraBrickRow = (key: string) => {
    if (stagesReadOnly) return;
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const handleOpenShift = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await openShiftReportAction({
        productionDate: initialSummary.date,
        shift: selectedShift,
        foremanName: foremanName.trim() || user.name,
      });
      if (res.ok) {
        setFeedback({
          type: 'ok',
          text: `🟢 Turno ${SHIFT_LABELS[selectedShift]} iniciado correctamente por ${foremanName.trim() || user.name}. Ya puedes cargar la producción.`,
        });
        router.refresh();
      } else {
        setFeedback({ type: 'err', text: res.error || 'No se pudo iniciar el turno.' });
      }
    } catch {
      setFeedback({ type: 'err', text: 'Error de conexión al intentar abrir el turno.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (targetStatus: 'EN_CURSO' | 'CERRADO') => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await saveShiftReportAction({
        productionDate: initialSummary.date,
        shift: selectedShift,
        foremanName,
        status: targetStatus,
        gasConsumption: Number(gasConsumption) || 0,
        dispatchedTons: Number(dispatchedTons) || 0,
        blackEarthTrips: Number(blackEarthTrips) || 0,
        redEarthTrips: Number(redEarthTrips) || 0,
        notes,
        entries: rows.map((r) => ({
          stage: r.stage,
          brickTypeId: r.brickTypeId,
          quantity: Number(r.quantity) || 0,
        })),
      });

      if (res.ok) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`ceramica_offline_${initialSummary.date}_${selectedShift}`);
        }
        setFeedback({
          type: 'ok',
          text:
            targetStatus === 'CERRADO'
              ? '🔒 ¡Turno cerrado y registrado correctamente! Ya no admite modificaciones por capataz.'
              : '💾 Avance del turno guardado en tiempo real.',
        });
        setConfirmCloseOpen(false);
        router.refresh();
      } else {
        setFeedback({ type: 'err', text: res.error || 'Error al guardar el parte.' });
      }
    } catch {
      if (typeof window !== 'undefined') {
        const offlineKey = `ceramica_offline_${initialSummary.date}_${selectedShift}`;
        const offlineData = {
          productionDate: initialSummary.date,
          shift: selectedShift,
          foremanName,
          status: targetStatus,
          gasConsumption,
          dispatchedTons,
          blackEarthTrips,
          redEarthTrips,
          notes,
          rows,
          timestamp: new Date().toISOString(),
        };
        try {
          localStorage.setItem(offlineKey, JSON.stringify(offlineData));
          setFeedback({
            type: 'ok',
            text: '📡 Modo sin conexión: Datos guardados en la memoria de tu celular. Se sincronizarán automáticamente con el servidor al recuperar señal.',
          });
          setConfirmCloseOpen(false);
        } catch {
          setFeedback({ type: 'err', text: 'Error de conexión y memoria llena en el dispositivo.' });
        }
      } else {
        setFeedback({ type: 'err', text: 'Error de red al guardar el parte.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSuppliesOnly = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await saveSuppliesReportAction({
        productionDate: initialSummary.date,
        shift: selectedShift,
        gasConsumption: Number(gasConsumption) || 0,
        dispatchedTons: Number(dispatchedTons) || 0,
        blackEarthTrips: Number(blackEarthTrips) || 0,
        redEarthTrips: Number(redEarthTrips) || 0,
      });
      if (res.ok) {
        setFeedback({
          type: 'ok',
          text: `💾 Datos de Salida de Material, Consumo de Gas y Viajes de Tierra guardados para el Turno ${SHIFT_LABELS[selectedShift]}.`,
        });
        router.refresh();
      } else {
        setFeedback({ type: 'err', text: res.error || 'No se pudieron guardar los datos.' });
      }
    } catch {
      setFeedback({ type: 'err', text: 'Error de conexión al guardar suministros.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReopen = async () => {
    if (!currentReport) return;
    setSaving(true);
    const res = await reopenShiftReportAction(currentReport.id);
    setSaving(false);
    if (res.ok) {
      setFeedback({ type: 'ok', text: '🔓 Turno reabierto por Administrador para edición.' });
      router.refresh();
    } else {
      setFeedback({ type: 'err', text: res.error || 'No se pudo reabrir.' });
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Cabecera y Navegador de Fecha + Turno (Mañana / Tarde) */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {user.role === 'INGENIERO_ENCARGADO'
                ? 'Visualización de Turno y Carga de Salida / Gas / Tierra'
                : 'Planilla Operativa de Planta'}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">
              PRODUCCIÓN POR TURNO ({formatDateDMY(initialSummary.date)})
            </h1>
          </div>

          {/* Selector de Fecha */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/90 p-1.5 rounded-xl border border-slate-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => handleDateChange(addDays(initialSummary.date, -1))}
              aria-label="Día anterior"
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-zinc-900 hover:bg-amber-500/10 text-slate-700 dark:text-zinc-200 shadow-2xs cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="relative flex items-center px-2">
              <Calendar className="w-4 h-4 text-amber-500 mr-2 pointer-events-none" />
              <input
                type="date"
                value={initialSummary.date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-transparent font-bold text-base text-slate-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
              />
            </div>
            <button
              type="button"
              onClick={() => handleDateChange(addDays(initialSummary.date, 1))}
              aria-label="Día siguiente"
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-zinc-900 hover:bg-amber-500/10 text-slate-700 dark:text-zinc-200 shadow-2xs cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selector de los 2 Turnos (MAÑANA y TARDE) + CAPATAZ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-2 border-t border-slate-200/80 dark:border-zinc-800">
          <div className="lg:col-span-6">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
              SELECCIONAR TURNO (MAÑANA / TARDE)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {ACTIVE_SHIFTS.map((sh) => {
                const active = selectedShift === sh;
                const rep = initialSummary.shifts[sh];
                return (
                  <button
                    key={sh}
                    type="button"
                    onClick={() => setSelectedShift(sh)}
                    className={`flex flex-col items-center justify-center py-3 px-4 rounded-xl border font-bold text-xs sm:text-sm transition-all min-h-[52px] cursor-pointer ${
                      active
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20'
                        : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>TURNO {SHIFT_LABELS[sh]}</span>
                    <span
                      className={`text-[11px] font-semibold mt-0.5 ${
                        active
                          ? 'text-amber-100'
                          : rep?.status === 'CERRADO' || rep?.status === 'AUDITADO'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : rep?.status === 'EN_CURSO'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {rep
                        ? rep.status === 'EN_CURSO'
                          ? `● En Curso (${rep.foremanName})`
                          : `✓ Cerrado (${rep.foremanName})`
                        : '○ Sin iniciar'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                CAPATAZ EN TURNO
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled={!userCanEditStages || (isClosed && !isAdmin)}
                  value={foremanName}
                  onChange={(e) => setForemanName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-base font-bold bg-amber-50/70 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-slate-900 dark:text-zinc-100 min-h-[52px] disabled:opacity-70"
                />
              </div>
            </div>

            {isClosed && isAdmin && (
              <button
                type="button"
                onClick={handleReopen}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 min-h-[52px] cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Reabrir Turno (Admin)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PANEL DE APERTURA DE TURNO: Cuando el turno seleccionado aún no fue iniciado */}
      {!isShiftOpened && userCanEditStages && (
        <div className="rounded-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent border-2 border-amber-500/50 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-amber-500 text-slate-950">
                <PlayCircle className="w-4 h-4" />
                <span>Apertura de Turno Requerida</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-zinc-100">
                ¿Vas a iniciar el TURNO {SHIFT_LABELS[selectedShift]} del día {formatDateDMY(initialSummary.date)}?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 max-w-2xl">
                Como los capataces rotan entre turnos, verifica que arriba esté seleccionado{' '}
                <strong>TURNO MAÑANA</strong> o <strong>TURNO TARDE</strong> según corresponda y presiona{' '}
                <strong>&ldquo;Abrir / Iniciar Turno&rdquo;</strong> para habilitar la carga de producción.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenShift}
              disabled={saving}
              className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-extrabold text-sm sm:text-base bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-600/25 transition-all min-h-[54px] shrink-0 cursor-pointer disabled:opacity-50"
            >
              <PlayCircle className="w-5 h-5" />
              <span>
                {saving
                  ? 'Iniciando turno...'
                  : `Abrir / Iniciar Turno ${SHIFT_LABELS[selectedShift]}`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* BANNER DE TURNO CERRADO (Inmutable para Capataz, editable solo por Administrador) */}
      {isClosed && (
        <div className="rounded-2xl bg-slate-100 dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">
                Turno {SHIFT_LABELS[selectedShift]} Cerrado — Capataz: {currentReport?.foremanName}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isAdmin
                  ? 'Como Administrador General tienes permisos para editar directamente o reabrir el turno.'
                  : 'Este turno ya fue cerrado y no permite modificaciones de etapas. Solo el Administrador puede modificarlo.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BANNER INFORMATIVO PARA LA PERSONA QUE CARGA SALIDA, GAS Y TIERRA */}
      {user.role === 'INGENIERO_ENCARGADO' && (
        <div className="rounded-2xl bg-blue-500/10 border border-blue-500/30 p-4 flex items-center gap-3 text-xs sm:text-sm text-blue-800 dark:text-blue-200">
          <Eye className="w-5 h-5 text-blue-500 shrink-0" />
          <div>
            <strong>Modo Visualización y Carga de Suministros:</strong> A la izquierda puedes
            visualizar todos los datos de producción cargados por el Capataz, y a la derecha tienes
            habilitada la carga de <strong>Salida de Material, Consumo de Gas y Viajes de Tierra</strong>.
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-bold ${
            feedback.type === 'ok'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          {feedback.type === 'ok' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Grilla Principal Idéntica a la Planilla: Izquierda 5 Etapas (8 cols) | Derecha Salida, Gas y Tierra (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* BLOQUE IZQUIERDO: LAS 5 ETAPAS DE LÍNEA (CARGA DEL CAPATAZ) */}
        <div
          className={`xl:col-span-8 space-y-4 transition-opacity ${
            !isShiftOpened && user.role === 'CAPATAZ' ? 'opacity-60 pointer-events-none' : ''
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              1. Etapas de Producción (Carga del Capataz)
            </span>
            {stagesReadOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                <Lock className="w-3 h-3" /> Solo lectura
              </span>
            )}
          </div>

          {STAGE_SECTIONS.map((section) => (
            <div
              key={section.id}
              className={`rounded-2xl bg-white dark:bg-zinc-900 border-2 ${section.borderClass} overflow-hidden shadow-xs`}
            >
              {/* Franja de color de la etapa (Verde, Amarillo, Marrón, Rojo, Gris) */}
              <div
                className={`px-4 py-2.5 font-extrabold text-sm tracking-wider uppercase flex items-center justify-between ${section.headerBg}`}
              >
                <span>{section.title}</span>
                <span className="text-[11px] font-bold opacity-90">
                  Unidad: {section.unitLabel}
                </span>
              </div>

              <div className="p-3.5 sm:p-4 space-y-4 divide-y divide-slate-200/70 dark:divide-zinc-800">
                {section.subStages.map((sub) => {
                  const stageRows = rows.filter((r) => r.stage === sub.stage);
                  return (
                    <div key={sub.stage} className="pt-3 first:pt-0 space-y-3">
                      {stageRows.map((row, idx) => {
                        const selectedBrick = activeBricks.find(
                          (b) => b.id === row.brickTypeId
                        );
                        const qtyNum = Number(row.quantity) || 0;
                        const isWagon = section.unitLabel === 'Zorras';
                        const factor = selectedBrick
                          ? isWagon
                            ? selectedBrick.unitsPerWagon
                            : selectedBrick.unitsPerBench
                          : 0;
                        const calcUnits = Math.round(qtyNum * factor);

                        return (
                          <div
                            key={row.key}
                            className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-slate-50/70 dark:bg-zinc-950/60 p-3 rounded-xl border border-slate-200/70 dark:border-zinc-800/80"
                          >
                            {/* Etiqueta de Cantidad */}
                            <div className="sm:col-span-6 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-extrabold uppercase tracking-wide text-slate-700 dark:text-zinc-200">
                                  {sub.label} {idx > 0 ? `(#${idx + 1})` : ''}
                                </label>
                                {calcUnits > 0 && (
                                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                    ≈ {calcUnits.toLocaleString('es-AR')} ladrillos
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={stagesReadOnly}
                                  onClick={() => stepQuantity(row.key, -1)}
                                  className="w-11 h-11 rounded-xl font-extrabold text-lg bg-slate-200/80 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 hover:bg-slate-300 dark:hover:bg-zinc-700 shrink-0 cursor-pointer disabled:opacity-40"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  min="0"
                                  step="any"
                                  disabled={stagesReadOnly}
                                  value={row.quantity}
                                  onChange={(e) =>
                                    updateRow(row.key, { quantity: e.target.value })
                                  }
                                  className="w-full text-center font-extrabold text-lg py-2 px-3 rounded-xl bg-lime-100/80 dark:bg-lime-500/15 border-2 border-lime-400/70 dark:border-lime-500/40 text-slate-900 dark:text-lime-200 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                                />
                                <button
                                  type="button"
                                  disabled={stagesReadOnly}
                                  onClick={() => stepQuantity(row.key, 1)}
                                  className="w-11 h-11 rounded-xl font-extrabold text-lg bg-slate-200/80 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 hover:bg-slate-300 dark:hover:bg-zinc-700 shrink-0 cursor-pointer disabled:opacity-40"
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  disabled={stagesReadOnly}
                                  onClick={() => stepQuantity(row.key, 5)}
                                  className="px-2.5 h-11 rounded-xl font-bold text-xs bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0 cursor-pointer disabled:opacity-40"
                                >
                                  +5
                                </button>
                              </div>
                            </div>

                            {/* Selector de LADRILLO */}
                            <div className="sm:col-span-6 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-extrabold uppercase tracking-wide text-slate-700 dark:text-zinc-200">
                                  LADRILLO
                                </label>
                                {idx > 0 && !stagesReadOnly && (
                                  <button
                                    type="button"
                                    onClick={() => removeExtraBrickRow(row.key)}
                                    className="text-xs font-semibold text-rose-500 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Quitar
                                  </button>
                                )}
                              </div>

                              <select
                                disabled={stagesReadOnly}
                                value={row.brickTypeId}
                                onChange={(e) =>
                                  updateRow(row.key, {
                                    brickTypeId: Number(e.target.value),
                                  })
                                }
                                className="w-full py-2.5 px-3 rounded-xl font-bold text-base bg-lime-100/80 dark:bg-lime-500/15 border-2 border-lime-400/70 dark:border-lime-500/40 text-slate-900 dark:text-lime-200 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                              >
                                {activeBricks.map((b) => (
                                  <option
                                    key={b.id}
                                    value={b.id}
                                    className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100"
                                  >
                                    {b.code} — {b.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}

                      {!stagesReadOnly && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => addExtraBrickRow(sub.stage)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline py-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agregar otro tipo de ladrillo en {sub.label}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* OBSERVACIONES DEL TURNO (Cargadas por el Capataz) */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 space-y-2 shadow-xs">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
              Novedades / Observaciones del Capataz
            </label>
            <textarea
              rows={3}
              disabled={stagesReadOnly}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Cambio de molde a las 10:30hs, parada de 15 min en cortadora..."
              className="w-full p-3 rounded-xl text-base bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-70"
            />
          </div>
        </div>

        {/* BLOQUE DERECHO: SALIDA MATERIAL, CONSUMO DE GAS Y VIAJES TIERRA (CARGA DE LA OTRA PERSONA / ADMIN) */}
        <div className="xl:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              2. Salida, Gas y Tierra
            </span>
            {suppliesReadOnly ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                <ShieldAlert className="w-3 h-3 text-amber-500" /> Carga Encargado / Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> Habilitado para carga
              </span>
            )}
          </div>

          {/* 1. SALIDA MATERIAL */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-slate-200 dark:bg-zinc-800 font-extrabold text-sm tracking-wider uppercase text-slate-900 dark:text-zinc-100 flex items-center justify-between">
              <span>SALIDA MATERIAL</span>
              <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-extrabold uppercase text-slate-700 dark:text-zinc-300">
                  TONELADAS (Turno)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.1"
                  disabled={suppliesReadOnly}
                  value={dispatchedTons}
                  onChange={(e) => setDispatchedTons(e.target.value)}
                  className="w-36 text-right font-extrabold text-lg py-2 px-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px] disabled:opacity-60"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 flex justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
                <span>Total Acumulado del Día:</span>
                <strong className="text-slate-900 dark:text-zinc-100">
                  {initialSummary.totals.dispatchedTons} tn
                </strong>
              </p>
            </div>
          </div>

          {/* 2. CONSUMO DE GAS (SOLO TURNO MAÑANA Y TURNO TARDE) */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-slate-200 dark:bg-zinc-800 font-extrabold text-sm tracking-wider uppercase text-slate-900 dark:text-zinc-100 flex items-center justify-between">
              <span>CONSUMO DE GAS</span>
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div className="p-4 space-y-3">
              {ACTIVE_SHIFTS.map((sh) => {
                const isCurrentShift = sh === selectedShift;
                const otherVal =
                  sh === 'MANANA'
                    ? initialSummary.totals.gasManana
                    : initialSummary.totals.gasTarde;

                return (
                  <div
                    key={sh}
                    className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border ${
                      isCurrentShift
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-slate-50/60 dark:bg-zinc-950/40 border-slate-200/60 dark:border-zinc-800/60 opacity-80'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-extrabold uppercase block text-slate-800 dark:text-zinc-200">
                        TURNO {SHIFT_LABELS[sh]}
                      </span>
                      {isCurrentShift && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          Turno seleccionado
                        </span>
                      )}
                    </div>

                    {isCurrentShift ? (
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        disabled={suppliesReadOnly}
                        value={gasConsumption}
                        onChange={(e) => setGasConsumption(e.target.value)}
                        className="w-32 text-right font-extrabold text-lg py-1.5 px-3 rounded-xl bg-white dark:bg-zinc-900 border-2 border-amber-500 text-slate-900 dark:text-zinc-100 focus:outline-none min-h-[44px] disabled:opacity-60"
                      />
                    ) : (
                      <span className="font-bold text-base px-3 py-1.5 text-slate-600 dark:text-zinc-400">
                        {otherVal.toLocaleString('es-AR')} m³
                      </span>
                    )}
                  </div>
                );
              })}

              <div className="flex justify-between text-xs pt-2 border-t border-slate-100 dark:border-zinc-800">
                <span className="text-slate-500 dark:text-zinc-400">Gas Total del Día:</span>
                <strong className="text-slate-900 dark:text-zinc-100">
                  {initialSummary.totals.totalGas.toLocaleString('es-AR')} m³
                </strong>
              </div>
            </div>
          </div>

          {/* 3. VIAJES TIERRA */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-slate-200 dark:bg-zinc-800 font-extrabold text-sm tracking-wider uppercase text-slate-900 dark:text-zinc-100 flex items-center justify-between">
              <span>VIAJES TIERRA</span>
              <Mountain className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-extrabold uppercase text-slate-700 dark:text-zinc-300">
                  VIAJES NEGRA
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={suppliesReadOnly}
                    onClick={() =>
                      setBlackEarthTrips(
                        String(Math.max(0, (Number(blackEarthTrips) || 0) - 1))
                      )
                    }
                    className="w-10 h-10 rounded-xl font-bold bg-slate-200 dark:bg-zinc-800 cursor-pointer disabled:opacity-40"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    disabled={suppliesReadOnly}
                    value={blackEarthTrips}
                    onChange={(e) => setBlackEarthTrips(e.target.value)}
                    className="w-20 text-center font-extrabold text-lg py-1.5 px-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 min-h-[44px] disabled:opacity-60"
                  />
                  <button
                    type="button"
                    disabled={suppliesReadOnly}
                    onClick={() =>
                      setBlackEarthTrips(String((Number(blackEarthTrips) || 0) + 1))
                    }
                    className="w-10 h-10 rounded-xl font-bold bg-slate-200 dark:bg-zinc-800 cursor-pointer disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-extrabold uppercase text-slate-700 dark:text-zinc-300">
                  VIAJES ROJA
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={suppliesReadOnly}
                    onClick={() =>
                      setRedEarthTrips(
                        String(Math.max(0, (Number(redEarthTrips) || 0) - 1))
                      )
                    }
                    className="w-10 h-10 rounded-xl font-bold bg-slate-200 dark:bg-zinc-800 cursor-pointer disabled:opacity-40"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    disabled={suppliesReadOnly}
                    value={redEarthTrips}
                    onChange={(e) => setRedEarthTrips(e.target.value)}
                    className="w-20 text-center font-extrabold text-lg py-1.5 px-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 min-h-[44px] disabled:opacity-60"
                  />
                  <button
                    type="button"
                    disabled={suppliesReadOnly}
                    onClick={() =>
                      setRedEarthTrips(String((Number(redEarthTrips) || 0) + 1))
                    }
                    className="w-10 h-10 rounded-xl font-bold bg-slate-200 dark:bg-zinc-800 cursor-pointer disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Botón directo para guardar Salida, Gas y Tierra cuando ingresa la persona encargada */}
          {!suppliesReadOnly && (
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveSuppliesOnly}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-extrabold text-sm bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-md shadow-amber-600/20 min-h-[48px] cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {saving
                  ? 'Guardando...'
                  : `Guardar Salida, Gas y Tierra (${SHIFT_LABELS[selectedShift]})`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Barra Flotante Inferior: Para el Capataz (cuando el turno fue iniciado y no está cerrado) o Admin */}
      {!stagesReadOnly && (
        <div className="sticky bottom-3 z-30 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200 dark:border-zinc-800 p-3 shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-zinc-400 px-1">
            Turno: <strong className="text-slate-900 dark:text-zinc-100">{SHIFT_LABELS[selectedShift]}</strong> •{' '}
            Fecha: <strong className="text-slate-900 dark:text-zinc-100">{formatDateDMY(initialSummary.date)}</strong>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('EN_CURSO')}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 min-h-[48px] cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar Avance (En Vivo)'}</span>
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => setConfirmCloseOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 min-h-[48px] cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>Cerrar Turno Finalizado</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Cierre de Turno */}
      <Modal
        isOpen={confirmCloseOpen}
        onClose={() => setConfirmCloseOpen(false)}
        title="Confirmar Cierre de Turno"
        subtitle={`Turno ${SHIFT_LABELS[selectedShift]} — Fecha ${formatDateDMY(initialSummary.date)}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-zinc-300">
            Al cerrar el turno, los datos de las 5 etapas quedarán firmes y{' '}
            <strong>no podrán ser modificados por el capataz</strong> (solo el Administrador podrá
            editarlos). ¿Confirmas el cierre del Turno {SHIFT_LABELS[selectedShift]}?
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('CERRADO')}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white min-h-[48px] cursor-pointer"
            >
              {saving ? 'Cerrando...' : 'Sí, Cerrar Turno'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmCloseOpen(false)}
              className="py-3 px-4 rounded-xl font-semibold text-sm bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 min-h-[48px] cursor-pointer"
            >
              Seguir Editando
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
