import { redirect } from 'next/navigation';
import { getSession, ACTIVE_SHIFTS } from '@/utils/auth';
import { getDailyProductionData } from '@/app/actions/production';
import { AppLayout } from '@/components/layout/AppLayout';
import { CapatazSheetClient } from '@/components/capataz/CapatazSheetClient';
import type { ShiftType } from '@/db/schema';

function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default async function CapatazPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; shift?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;
  const dateStr =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : getTodayStr();

  const summary = await getDailyProductionData(dateStr);

  // Determinar turno inicial entre MAÑANA y TARDE (dado que los capataces rotan)
  let initialShift: ShiftType = 'MANANA';
  if (params.shift && ACTIVE_SHIFTS.includes(params.shift as ShiftType)) {
    initialShift = params.shift as ShiftType;
  } else if (summary.shifts.MANANA?.status === 'EN_CURSO') {
    initialShift = 'MANANA';
  } else if (summary.shifts.TARDE?.status === 'EN_CURSO') {
    initialShift = 'TARDE';
  } else if (summary.shifts.MANANA?.status === 'CERRADO' && !summary.shifts.TARDE) {
    initialShift = 'TARDE';
  } else {
    const currentHour = new Date().getHours();
    initialShift = currentHour >= 14 ? 'TARDE' : 'MANANA';
  }

  return (
    <AppLayout user={session}>
      <CapatazSheetClient
        user={session}
        initialSummary={summary}
        initialShift={initialShift}
      />
    </AppLayout>
  );
}
