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
    'Control de Producción por Turnos, Dashboard en Tiempo Real, PWA Móvil y Acceso con Huella',
    14,
    24
  );

  // Tabla 1: Matriz de Roles y Alcances
  autoTable(doc, {
    startY: 34,
    head: [['1. MATRIZ DE ROLES', 'DESTINATARIO', 'PERMISOS Y MÓDULOS HABILITADOS']],
    body: [
      [
        'CAPATAZ DE TURNO\n(CAPATAZ)',
        'Jefes de Turno\nMañana, Tarde y Noche',
        'Acceso a la Planilla Operativa Móvil (/capataz). Carga las 5 etapas (Extrusora, Secadero, Carga Manual/Robot, Horno, Descarga) más Salida en Toneladas, Gas y Viajes de Tierra. Guarda avances en vivo y cierra su turno.',
      ],
      [
        'INGENIERO / ENCARGADO\n(INGENIERO_ENCARGADO)',
        'Jefe de Planta e\nIngenieros de Producción',
        'Acceso al Dashboard en Tiempo Real, Navegador por Días, Estadísticas/Comparativas y Catálogo de Ladrillos. Puede Auditar, Editar o Reabrir cualquier turno cerrado por un capataz.',
      ],
      [
        'DIRECTORIO / DUEÑOS\n(DIRECTORIO)',
        'Socios, Dueños y\nGerencia General',
        'Acceso ejecutivo en Tiempo Real al Dashboard de Planta, Navegador Histórico por Días, Comparador de Fechas y Descarga de Reportes PDF (modo lectura segura).',
      ],
      [
        'ADMINISTRADOR GENERAL\n(ADMIN)',
        'Responsable de Sistemas /\nAdministración',
        'Control total de todos los módulos del sistema más el módulo exclusivo de Gestión de Usuarios y Roles (/usuarios) para altas, bajas, contraseñas y asignación de turnos.',
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
        'FLUJO DEL CAPATAZ\n(Carga en Celular)',
        'Paso 1: Ingresar con su usuario o tocando "Ingresar con Huella Digital".\nPaso 2: Verificar arriba la Fecha y que esté marcado su Turno (MAÑANA, TARDE o NOCHE).\nPaso 3: Completar las 5 franjas de color idénticas a la planilla:\n  • EXTRUSORA (Verde): Cantidad de Bancos y tipo de Ladrillo.\n  • SECADERO (Amarillo): Cantidad de Bancos y tipo de Ladrillo.\n  • CARGA DE BANCO (Marrón): Cantidad en fila MANUAL y cantidad en fila ROBOT + Ladrillo.\n  • HORNO (Rojo): Cantidad de ZORRAS CARGADAS y ZORRAS FUERA + Ladrillo.\n  • DESCARGA (Gris): Cantidad de Zorras descargadas + Ladrillo.\n  * Nota: Si se cambió de molde en el turno, tocar "+ Agregar otro tipo de ladrillo".\nPaso 4: Cargar Salida Material (Toneladas), Consumo de Gas de su turno y Viajes de Tierra (Negra / Roja).\nPaso 5: Tocar "Guardar Avance (En Vivo)" durante el turno, o "Cerrar Turno Finalizado" al terminar.',
      ],
      [
        'FLUJO DE DUEÑOS E\nINGENIEROS\n(Dashboard y Reportes)',
        'Paso 1: Al ingresar se abre el "Centro de Control de Producción" (/dashboard) sincronizado en vivo.\nPaso 2: Consultar las 6 tarjetas superiores (Extrusora, Secadero, Carga, Horno, Descarga y Gas/Tierra) y la matriz comparativa de los 3 turnos (Mañana, Tarde, Noche y Total Día).\nPaso 3: Usar las flechas (< / >), la tira rápida de días o el Calendario para viajar a cualquier fecha pasada.\nPaso 4: Pulsar "Exportar PDF" arriba a la derecha para descargar la planilla oficial del día.\nPaso 5: Entrar a "Comparativas y PDF" (/estadisticas) para usar el Comparador Directo (Día A vs. Día B) y ver eficiencia térmica (m³ de gas por zorra y por tonelada cocida).',
      ],
      [
        'AUDITORÍA Y REAPERTURA\n(Encargado / Admin)',
        '• Si un capataz cerró su turno y olvidó cargar un dato, el Encargado o Administrador ingresa al Dashboard, pulsa "Auditar / Editar Turno" en la tarjeta de ese turno y luego toca el botón "Reabrir Turno".\n• Desde "Catálogo Ladrillos" (/catalogo) puede crear nuevas medidas o actualizar cuántos ladrillos entran por banco/zorra y el peso unitario en kg.',
      ],
      [
        'INSTALACIÓN PWA Y\nHUELLA DIGITAL\n(Todos los Usuarios)',
        '1) Abrir la aplicación en el celular e iniciar sesión.\n2) Abrir el menú lateral (ícono arriba a la izquierda) y pulsar "Instalar App en Celular (PWA)".\n3) Pulsar "Acceso con Huella" -> "Activar Huella Digital Ahora" y colocar el dedo en el sensor del teléfono.\n4) Desde ese momento, al abrir la app solo deberá tocar "Ingresar con Huella Digital".',
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
