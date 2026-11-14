/**
 * Utilidades de formateo de fechas para CERÁMICA PRODUCCIÓN ERP.
 * Convierte cadenas de fecha ISO (YYYY-MM-DD) al estándar regional Día/Mes/Año (DD/MM/YYYY o DD-MM-YYYY).
 */

export function formatDateDMY(dateStr: string, separator: '/' | '-' = '/'): string {
  if (!dateStr) return '';
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}${separator}${month}${separator}${year}`;
  }
  return dateStr;
}

export function formatDateDMYHyphen(dateStr: string): string {
  return formatDateDMY(dateStr, '-');
}

/**
 * Formatea un rango de fechas en formato día/mes/año (ej: "08/11/2026 a 14/11/2026")
 */
export function formatDateRangeDMY(startDate: string, endDate: string): string {
  return `${formatDateDMY(startDate)} a ${formatDateDMY(endDate)}`;
}
