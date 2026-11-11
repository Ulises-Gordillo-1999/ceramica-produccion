'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DailyProductionSummary } from '@/app/actions/production';
import type { ProductionStageType, ShiftType } from '@/db/schema';

function formatStageCell(
  summary: DailyProductionSummary,
  shift: ShiftType,
  stage: ProductionStageType
): string {
  const rep = summary.shifts[shift];
  if (!rep) return '-';
  const entries = rep.entries.filter((e) => e.stage === stage);
  if (entries.length === 0) return '0';
  return entries.map((e) => `${e.quantity} (${e.brickCode})`).join(' + ');
}

export function exportDailyProductionPdf(summary: DailyProductionSummary) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE OFICIAL DE PRODUCCIÓN CERÁMICA', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha Operativa: ${summary.date}`, 14, 19);
  doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 215, 19);

  const mRep = summary.shifts.MANANA;
  const tRep = summary.shifts.TARDE;
  const nRep = summary.shifts.NOCHE;

  autoTable(doc, {
    startY: 30,
    head: [
      [
        'ETAPA / SECTOR',
        `TURNO MAÑANA\n(${mRep?.foremanName || 'Sin cargar'})`,
        `TURNO TARDE\n(${tRep?.foremanName || 'Sin cargar'})`,
        `TURNO NOCHE\n(${nRep?.foremanName || 'Sin cargar'})`,
        'TOTAL DÍA',
      ],
    ],
    body: [
      [
        'EXTRUSORA (Bancos)',
        formatStageCell(summary, 'MANANA', 'EXTRUSORA'),
        formatStageCell(summary, 'TARDE', 'EXTRUSORA'),
        formatStageCell(summary, 'NOCHE', 'EXTRUSORA'),
        `${summary.totals.extrusoraBenches} bancos (${summary.totals.estimatedExtrudedUnits.toLocaleString('es-AR')} u.)`,
      ],
      [
        'SECADERO (Bancos)',
        formatStageCell(summary, 'MANANA', 'SECADERO'),
        formatStageCell(summary, 'TARDE', 'SECADERO'),
        formatStageCell(summary, 'NOCHE', 'SECADERO'),
        `${summary.totals.secaderoBenches} bancos`,
      ],
      [
        'CARGA DE BANCO - MANUAL',
        formatStageCell(summary, 'MANANA', 'CARGA_MANUAL'),
        formatStageCell(summary, 'TARDE', 'CARGA_MANUAL'),
        formatStageCell(summary, 'NOCHE', 'CARGA_MANUAL'),
        `${summary.totals.cargaManualBenches} bancos`,
      ],
      [
        'CARGA DE BANCO - ROBOT',
        formatStageCell(summary, 'MANANA', 'CARGA_ROBOT'),
        formatStageCell(summary, 'TARDE', 'CARGA_ROBOT'),
        formatStageCell(summary, 'NOCHE', 'CARGA_ROBOT'),
        `${summary.totals.cargaRobotBenches} bancos`,
      ],
      [
        'HORNO - ZORRAS CARGADAS',
        formatStageCell(summary, 'MANANA', 'HORNO_CARGADAS'),
        formatStageCell(summary, 'TARDE', 'HORNO_CARGADAS'),
        formatStageCell(summary, 'NOCHE', 'HORNO_CARGADAS'),
        `${summary.totals.hornoCargadasWagons} zorras`,
      ],
      [
        'HORNO - ZORRAS FUERA',
        formatStageCell(summary, 'MANANA', 'HORNO_FUERA'),
        formatStageCell(summary, 'TARDE', 'HORNO_FUERA'),
        formatStageCell(summary, 'NOCHE', 'HORNO_FUERA'),
        `${summary.totals.hornoFueraWagons} zorras (${summary.totals.estimatedFiredTons} tn cocidas)`,
      ],
      [
        'DESCARGA (Zorras)',
        formatStageCell(summary, 'MANANA', 'DESCARGA'),
        formatStageCell(summary, 'TARDE', 'DESCARGA'),
        formatStageCell(summary, 'NOCHE', 'DESCARGA'),
        `${summary.totals.descargaWagons} zorras`,
      ],
      [
        'CONSUMO DE GAS (m³)',
        `${(mRep?.gasConsumption || 0).toLocaleString('es-AR')} m³`,
        `${(tRep?.gasConsumption || 0).toLocaleString('es-AR')} m³`,
        `${(nRep?.gasConsumption || 0).toLocaleString('es-AR')} m³`,
        `${summary.totals.totalGas.toLocaleString('es-AR')} m³`,
      ],
      [
        'SALIDA MATERIAL (Toneladas)',
        `${mRep?.dispatchedTons || 0} tn`,
        `${tRep?.dispatchedTons || 0} tn`,
        `${nRep?.dispatchedTons || 0} tn`,
        `${summary.totals.dispatchedTons} tn`,
      ],
      [
        'VIAJES TIERRA NEGRA / ROJA',
        `Negra: ${mRep?.blackEarthTrips || 0} | Roja: ${mRep?.redEarthTrips || 0}`,
        `Negra: ${tRep?.blackEarthTrips || 0} | Roja: ${tRep?.redEarthTrips || 0}`,
        `Negra: ${nRep?.blackEarthTrips || 0} | Roja: ${nRep?.redEarthTrips || 0}`,
        `Negra: ${summary.totals.blackEarthTrips} | Roja: ${summary.totals.redEarthTrips}`,
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [217, 119, 6],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });

  doc.save(`produccion-ceramica-${summary.date}.pdf`);
}

