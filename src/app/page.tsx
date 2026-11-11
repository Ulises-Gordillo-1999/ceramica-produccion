import { redirect } from 'next/navigation';
import { getSession } from '@/utils/auth';

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  if (session.role === 'CAPATAZ') {
    redirect('/capataz');
  }
  redirect('/dashboard');
}

