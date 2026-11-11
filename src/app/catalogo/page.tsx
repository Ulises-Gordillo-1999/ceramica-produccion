import { redirect } from 'next/navigation';
import { getSession } from '@/utils/auth';
import { getBricksCatalogAction } from '@/app/actions/catalogAndUsers';
import { AppLayout } from '@/components/layout/AppLayout';
import { CatalogoClient } from '@/components/catalogo/CatalogoClient';

export default async function CatalogoPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const bricks = await getBricksCatalogAction();

  return (
    <AppLayout user={session}>
      <CatalogoClient bricks={bricks} />
    </AppLayout>
  );
}
