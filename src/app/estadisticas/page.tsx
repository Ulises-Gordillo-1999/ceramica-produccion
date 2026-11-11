import { redirect } from 'next/navigation';
import { getSession } from '@/utils/auth';
import { getRangeComparisonData } from '@/app/actions/production';
import { AppLayout } from '@/components/layout/AppLayout';
import { EstadisticasClient } from '@/components/estadisticas/EstadisticasClient';

function formatOffsetDate(offsetDays: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + offsetDays);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default async function EstadisticasPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;
  const startDate =
    params.from && /^\d{4}-\d{2}-\d{2}$/.test(params.from)
      ? params.from
      : formatOffsetDate(-6);
  const endDate =
    params.to && /^\d{4}-\d{2}-\d{2}$/.test(params.to)
      ? params.to
      : formatOffsetDate(0);

  const data = await getRangeComparisonData(startDate, endDate);

  return (
    <AppLayout user={session}>
      <EstadisticasClient
        startDate={startDate}
        endDate={endDate}
        days={data.days}
        recentLogs={data.recentLogs}
      />
    </AppLayout>
  );
}
