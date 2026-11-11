'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit3, Layers, Scale, Box } from 'lucide-react';
import type { BrickType } from '@/db/schema';
import { saveBrickTypeAction } from '@/app/actions/catalogAndUsers';
import { Modal } from '@/components/ui/Modal';

export function CatalogoClient({ bricks }: { bricks: BrickType[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [unitsPerBench, setUnitsPerBench] = useState('480');
  const [unitsPerWagon, setUnitsPerWagon] = useState('1440');
  const [unitWeightKg, setUnitWeightKg] = useState('4.2');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreate = () => {
    setEditingId(undefined);
    setCode('');
    setName('');
    setDimensions('');
    setUnitsPerBench('480');
    setUnitsPerWagon('1440');
    setUnitWeightKg('4.2');
    setIsActive(true);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (b: BrickType) => {
    setEditingId(b.id);
    setCode(b.code);
    setName(b.name);
    setDimensions(b.dimensions);
    setUnitsPerBench(String(b.unitsPerBench));
    setUnitsPerWagon(String(b.unitsPerWagon));
    setUnitWeightKg(String(b.unitWeightKg));
    setIsActive(b.isActive);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await saveBrickTypeAction({
        id: editingId,
        code,
        name,
        dimensions,
        unitsPerBench: Number(unitsPerBench) || 480,
        unitsPerWagon: Number(unitsPerWagon) || 1440,
        unitWeightKg: Number(unitWeightKg) || 4.2,
        isActive,
      });

      if (res.ok) {
        setModalOpen(false);
        router.refresh();
      } else {
        setError(res.error || 'Error al guardar el ladrillo.');
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
            Parámetros de Planta
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Catálogo de Tipos de Ladrillo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            Define los modelos que aparecen en el selector de los capataces y sus equivalencias por banco y zorra.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-md min-h-[46px] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Tipo de Ladrillo</span>
        </button>
      </div>

      {/* Vista Móvil (< md): Tarjetas */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {bricks.map((b) => (
          <div
            key={b.id}
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg font-extrabold text-sm bg-lime-500/20 text-lime-800 dark:text-lime-300">
                  {b.code}
                </span>
                <div>
                  <p className="font-bold text-sm">{b.name}</p>
                  <p className="text-xs text-slate-500">{b.dimensions}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openEdit(b)}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs">
              <div>
                <span className="text-slate-400 block">Unid/Banco</span>
                <strong>{b.unitsPerBench} u.</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Unid/Zorra</span>
                <strong>{b.unitsPerWagon} u.</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Peso Unit.</span>
                <strong>{b.unitWeightKg} kg</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vista Desktop (md+): Tabla */}
      <div className="hidden md:block rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 text-[11px] font-extrabold uppercase text-slate-500">
              <th className="py-3.5 px-5">Código</th>
              <th className="py-3.5 px-5">Descripción / Modelo</th>
              <th className="py-3.5 px-5">Medidas</th>
              <th className="py-3.5 px-5">Ladrillos / Banco</th>
              <th className="py-3.5 px-5">Ladrillos / Zorra</th>
              <th className="py-3.5 px-5">Peso Unitario</th>
              <th className="py-3.5 px-5">Estado</th>
              <th className="py-3.5 px-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 dark:divide-zinc-800 text-sm">
            {bricks.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40">
                <td className="py-3.5 px-5">
                  <span className="px-2.5 py-1 rounded-lg font-extrabold text-xs bg-lime-500/20 text-lime-800 dark:text-lime-300">
                    {b.code}
                  </span>
                </td>
                <td className="py-3.5 px-5 font-bold">{b.name}</td>
                <td className="py-3.5 px-5 text-slate-500">{b.dimensions}</td>
                <td className="py-3.5 px-5 font-semibold">{b.unitsPerBench} u.</td>
                <td className="py-3.5 px-5 font-semibold">{b.unitsPerWagon} u.</td>
                <td className="py-3.5 px-5 font-semibold">{b.unitWeightKg} kg</td>
                <td className="py-3.5 px-5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      b.isActive
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-200 dark:bg-zinc-800 text-slate-500'
                    }`}
                  >
                    {b.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="py-3.5 px-5 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(b)}
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
        title={editingId ? 'Editar Tipo de Ladrillo' : 'Nuevo Tipo de Ladrillo'}
        subtitle="Configura el código corto y los factores de conversión de planta"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 text-xs font-bold text-rose-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Código Corto
              </label>
              <input
                type="text"
                required
                placeholder="Ej. H12"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-base bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-bold min-h-[44px]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Nombre del Ladrillo
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Hueco 12x18x33"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-base bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-bold min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Dimensiones (cm)
            </label>
            <input
              type="text"
              placeholder="Ej. 12 x 18 x 33 cm"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-base bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Unidades / Banco
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  required
                  value={unitsPerBench}
                  onChange={(e) => setUnitsPerBench(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-base bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-bold min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Unidades / Zorra
              </label>
              <div className="relative">
                <Box className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  required
                  value={unitsPerWagon}
                  onChange={(e) => setUnitsPerWagon(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-base bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-bold min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Peso Unit. (kg)
              </label>
              <div className="relative">
                <Scale className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.1"
                  required
                  value={unitWeightKg}
                  onChange={(e) => setUnitWeightKg(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-base bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-bold min-h-[44px]"
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded accent-amber-600"
            />
            <span>Mostrar disponible para carga en planilla de capataces</span>
          </label>

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-500 text-white min-h-[48px] cursor-pointer"
            >
              {saving ? 'Guardando...' : 'Guardar Ladrillo'}
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

