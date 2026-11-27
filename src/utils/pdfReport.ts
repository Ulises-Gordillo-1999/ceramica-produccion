'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DailyProductionSummary } from '@/app/actions/production';
import type { ProductionStageType, ShiftType } from '@/db/schema';
import { formatDateDMY, formatDateDMYHyphen } from '@/utils/dates';

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
  doc.text('REPORTE OFICIAL DE PRODUCCIÓN CERÁMICA (TURNOS MAÑANA Y TARDE)', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha Operativa: ${formatDateDMY(summary.date)}`, 14, 19);
  doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 215, 19);

  const mRep = summary.shifts.MANANA;
  const tRep = summary.shifts.TARDE;

  autoTable(doc, {
    startY: 30,
    head: [
      [
        'ETAPA / SECTOR',
        `TURNO MAÑANA\n(${mRep?.foremanName || 'Sin iniciar'})`,
        `TURNO TARDE\n(${tRep?.foremanName || 'Sin iniciar'})`,
        'TOTAL DÍA',
      ],
    ],
    body: [
      [
        'EXTRUSORA (Bancos)',
        formatStageCell(summary, 'MANANA', 'EXTRUSORA'),
        formatStageCell(summary, 'TARDE', 'EXTRUSORA'),
        `${summary.totals.extrusoraBenches} bancos (${summary.totals.estimatedExtrudedUnits.toLocaleString('es-AR')} u.)`,
      ],
      [
        'SECADERO (Bancos)',
        formatStageCell(summary, 'MANANA', 'SECADERO'),
        formatStageCell(summary, 'TARDE', 'SECADERO'),
        `${summary.totals.secaderoBenches} bancos`,
      ],
      [
        'CARGA DE BANCO - MANUAL',
        formatStageCell(summary, 'MANANA', 'CARGA_MANUAL'),
        formatStageCell(summary, 'TARDE', 'CARGA_MANUAL'),
        `${summary.totals.cargaManualBenches} bancos`,
      ],
      [
        'CARGA DE BANCO - ROBOT',
        formatStageCell(summary, 'MANANA', 'CARGA_ROBOT'),
        formatStageCell(summary, 'TARDE', 'CARGA_ROBOT'),
        `${summary.totals.cargaRobotBenches} bancos`,
      ],
      [
        'HORNO - ZORRAS CARGADAS',
        formatStageCell(summary, 'MANANA', 'HORNO_CARGADAS'),
        formatStageCell(summary, 'TARDE', 'HORNO_CARGADAS'),
        `${summary.totals.hornoCargadasWagons} zorras`,
      ],
      [
        'HORNO - ZORRAS FUERA',
        formatStageCell(summary, 'MANANA', 'HORNO_FUERA'),
        formatStageCell(summary, 'TARDE', 'HORNO_FUERA'),
        `${summary.totals.hornoFueraWagons} zorras (${summary.totals.estimatedFiredTons} tn cocidas)`,
      ],
      [
        'DESCARGA (Zorras)',
        formatStageCell(summary, 'MANANA', 'DESCARGA'),
        formatStageCell(summary, 'TARDE', 'DESCARGA'),
        `${summary.totals.descargaWagons} zorras`,
      ],
      [
        'CONSUMO DE GAS (m³)',
        `${(mRep?.gasConsumption || 0).toLocaleString('es-AR')} m³`,
        `${(tRep?.gasConsumption || 0).toLocaleString('es-AR')} m³`,
        `${summary.totals.totalGas.toLocaleString('es-AR')} m³`,
      ],
      [
        'SALIDA MATERIAL (Toneladas)',
        `${mRep?.dispatchedTons || 0} tn`,
        `${tRep?.dispatchedTons || 0} tn`,
        `${summary.totals.dispatchedTons} tn`,
      ],
      [
        'VIAJES TIERRA NEGRA / ROJA',
        `Negra: ${mRep?.blackEarthTrips || 0} | Roja: ${mRep?.redEarthTrips || 0}`,
        `Negra: ${tRep?.blackEarthTrips || 0} | Roja: ${tRep?.redEarthTrips || 0}`,
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

  doc.save(`produccion-ceramica-${formatDateDMYHyphen(summary.date)}.pdf`);
}

export function buildUserManualPdfDoc(): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Encabezado Institucional
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DOCUMENTACIÓN OFICIAL DE OPERACIÓN Y FLUJO DEL SISTEMA', 14, 10);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text('MANUAL DE USUARIO — CERÁMICA PRODUCCIÓN ERP', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Control de Producción en 2 Turnos (Mañana y Tarde), Dashboard en Vivo y PWA Móvil',
    14,
    24
  );

  // Tabla 1: Matriz de Roles y Alcances
  autoTable(doc, {
    startY: 34,
    head: [['1. MATRIZ DE ROLES', 'DESTINATARIO', 'PERMISOS Y MÓDULOS HABILITADOS']],
    body: [
      [
        'CAPATAZ DE TURNO\n(CAPATAZ — Rotativo)',
        'Capataces de Planta\n(Rotan Mañana y Tarde)',
        'Al ingresar a /capataz elige si va a iniciar el TURNO MAÑANA o TURNO TARDE y pulsa "Abrir / Iniciar Turno". Carga las 5 etapas productivas (Extrusora, Secadero, Carga Manual/Robot, Horno, Descarga). Una vez cerrado el turno, no puede modificar nada.',
      ],
      [
        'ENCARGADO SUMINISTROS\n(INGENIERO_ENCARGADO)',
        'Responsable de Salida,\nGas y Viajes de Tierra',
        'Puede visualizar todos los datos que cargó el Capataz en las 5 etapas y tiene habilitada la carga exclusiva de Salida de Material (Toneladas), Consumo de Gas (m³) y Viajes de Tierra (Negra / Roja).',
      ],
      [
        'DIRECTORIO / DUEÑOS\n(DIRECTORIO)',
        'Socios, Dueños y\nGerencia General',
        'Acceso ejecutivo en Tiempo Real al Dashboard de Planta, Navegador Histórico por Días, Comparador de Fechas y Descarga de Reportes PDF (modo lectura segura).',
      ],
      [
        'ADMINISTRADOR GENERAL\n(ADMIN)',
        'Responsable de Sistemas /\nAdministración',
        'Control total del sistema. Es el ÚNICO rol que puede modificar o reabrir un turno cerrado por un capataz, además de gestionar Usuarios (/usuarios) y Catálogo de Ladrillos (/catalogo).',
      ],
    ],
    theme: 'grid',
    margin: { left: 14, right: 14 },
    headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 44, fontStyle: 'bold' },
      1: { cellWidth: 38 },
      2: { cellWidth: 'auto' },
    },
    styles: { fontSize: 8.5, cellPadding: 3.2 },
  });

  // Tabla 2: Paso a Paso Detallado por Rol
  const afterRolesY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  autoTable(doc, {
    startY: afterRolesY,
    head: [['2. GUÍA PASO A PASO POR ROL OPERATIVO', 'INSTRUCCIONES DETALLADAS DE USO']],
    body: [
      [
        'FLUJO DEL CAPATAZ\n(Turnos Mañana y Tarde)',
        'Paso 1: Ingresar con su usuario de Capataz o Huella Digital.\nPaso 2: Seleccionar arriba si corresponde al TURNO MAÑANA o TURNO TARDE y pulsar "Abrir / Iniciar Turno".\nPaso 3: Completar las 5 etapas de producción:\n  • EXTRUSORA (Verde): Cantidad de Bancos y tipo de Ladrillo.\n  • SECADERO (Amarillo): Cantidad de Bancos y tipo de Ladrillo.\n  • CARGA DE BANCO (Marrón): Cantidad en fila MANUAL y fila ROBOT + Ladrillo.\n  • HORNO (Rojo): Cantidad de ZORRAS CARGADAS y ZORRAS FUERA + Ladrillo.\n  • DESCARGA (Gris): Cantidad de Zorras descargadas + Ladrillo.\nPaso 4: Tocar "Guardar Avance (En Vivo)" durante el turno, o "Cerrar Turno Finalizado" al terminar. Una vez cerrado, el turno queda bloqueado y solo el Administrador puede modificarlo.',
      ],
      [
        'CARGA DE SALIDA,\nGAS Y TIERRA',
        '• La persona encargada ingresa a la Planilla de Turno (/capataz), selecciona Turno Mañana o Turno Tarde, visualiza lo que cargó el Capataz a la izquierda y completa a la derecha:\n  1) Salida Material (Toneladas)\n  2) Consumo de Gas (m³)\n  3) Viajes de Tierra (Negra y Roja)\n• Finalmente presiona "Guardar Salida, Gas y Tierra".',
      ],
      [
        'AUDITORÍA Y REAPERTURA\n(Exclusivo Administrador)',
        '• Una vez que un capataz cierra su turno, ningún capataz puede alterarlo.\n• Únicamente el Administrador General puede ingresar al turno cerrado y modificar un valor o pulsar "Reabrir Turno (Admin)".',
      ],
      [
        'INSTALACIÓN PWA Y\nHUELLA DIGITAL',
        '1) Abrir la aplicación en el celular e iniciar sesión.\n2) Abrir el menú lateral y pulsar "Instalar App en Celular (PWA)".\n3) Pulsar "Acceso con Huella" -> "Activar Huella Digital Ahora" para ingresar con biometría.',
      ],
    ],
    theme: 'grid',
    margin: { left: 14, right: 14 },
    headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
    },
    styles: { fontSize: 8.5, cellPadding: 3.5 },
  });

  return doc;
}

export function exportUserManualPdf() {
  const doc = buildUserManualPdfDoc();
  doc.save('Manual_Usuario_Ceramica_Produccion.pdf');
}
