import { redirect } from 'next/navigation';
import { getSession } from '@/utils/auth';
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

  const validShifts: ShiftType[] = ['MANANA', 'TARDE', 'NOCHE'];
  const initialShift: ShiftType = validShifts.includes(params.shift as ShiftType)
    ? (params.shift as ShiftType)
    : session.defaultShift || 'MANANA';

  const summary = await getDailyProductionData(dateStr);

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

