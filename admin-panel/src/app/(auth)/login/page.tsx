import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AuthSplit } from '@/components/auth/AuthSplit';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; reset?: string };
}) {
  // An already-signed-in admin shouldn't see the login screen.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: admin } = await supabase.from('admin_users').select('status').eq('id', user.id).maybeSingle();
    if (admin?.status === 'active') redirect('/');
  }

  const notice =
    searchParams.error === 'not_admin'
      ? "That account doesn't have admin panel access."
      : searchParams.reset === '1'
        ? 'Password updated — sign in with your new password.'
        : null;

  return (
    <AuthSplit>
      <LoginForm notice={notice} noticeTone={searchParams.reset === '1' ? 'success' : 'error'} />
    </AuthSplit>
  );
}
