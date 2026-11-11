import { redirect } from 'next/navigation';
import { getSession } from '@/utils/auth';
import { getDailyProductionData } from '@/app/actions/production';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminDashboardClient } from '@/components/dashboard/AdminDashboardClient';

function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
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

  return (
    <AppLayout user={session}>
      <AdminDashboardClient user={session} summary={summary} />
    </AppLayout>
  );
}
