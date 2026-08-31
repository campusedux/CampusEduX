'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

type State = { error: string | null; ok?: boolean; message?: string };

const STAFF_ROLES = ['super_admin', 'admin', 'editor', 'support', 'viewer'];

export async function signInAction(_prev: State, formData: FormData): Promise<State> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) return { error: 'Enter your email and password.' };

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: 'Incorrect email or password.' };

  const { data: admin } = await supabase
    .from('admin_users')
    .select('role, status')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!admin || !STAFF_ROLES.includes(admin.role) || admin.status !== 'active') {
    await supabase.auth.signOut();
    return { error: "This account doesn't have admin panel access." };
  }

  // Best-effort last-login stamp; never block sign-in on it.
  await supabase.from('admin_users').update({ last_login_at: new Date().toISOString() }).eq('id', data.user.id);

  redirect('/');
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function sendResetLinkAction(_prev: State, formData: FormData): Promise<State> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { error: 'Enter your admin email.' };

  const supabase = createClient();
  const origin = headers().get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  // Don't reveal whether the address exists.
  if (error) console.warn('[admin] resetPasswordForEmail:', error.message);
  return {
    error: null,
    ok: true,
    message: 'If that email belongs to an admin account, a 6-digit code and reset link are on their way.',
  };
}

export async function verifyOtpAction(_prev: State, formData: FormData): Promise<State> {
  const email = String(formData.get('email') ?? '').trim();
  const token = String(formData.get('token') ?? '').trim();
  if (!email || token.length !== 6) return { error: 'Enter the 6-digit code from your email.' };

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
  if (error) return { error: 'That code is invalid or has expired. Request a new one.' };

  redirect('/reset-password');
}

export async function resendOtpAction(_prev: State, formData: FormData): Promise<State> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { error: 'Missing email address.' };
  const supabase = createClient();
  const origin = headers().get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? '';
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/reset-password` });
  return { error: null, ok: true, message: 'A fresh code is on its way.' };
}

export async function updatePasswordAction(_prev: State, formData: FormData): Promise<State> {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (password.length < 10) return { error: 'Use at least 10 characters.' };
  if (password !== confirm) return { error: 'The two passwords don’t match.' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Your reset link has expired. Start again from Forgot Password.' };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect('/login?reset=1');
}
