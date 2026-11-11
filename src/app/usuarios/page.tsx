import { redirect } from 'next/navigation';
import { getSession } from '@/utils/auth';
import { getUsersListAction } from '@/app/actions/catalogAndUsers';
import { AppLayout } from '@/components/layout/AppLayout';
import { UsuariosClient } from '@/components/usuarios/UsuariosClient';

export default async function UsuariosPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const usersList = await getUsersListAction();

  return (
    <AppLayout user={session}>
      <UsuariosClient usersList={usersList} />
    </AppLayout>
  );
}
