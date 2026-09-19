'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient as createSbClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { setAuthBan } from '@/lib/supabase/adminApi';

type Result = { ok: boolean; error?: string };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const nullable = (v: string) => (v === '' ? null : v);

/**
 * Create a student. No service-role key (project rule), so the auth.users row
 * is created with a normal signUp() on a throw-away client that never persists
 * a session — the admin's own cookies are untouched. The mobile
 * handle_new_user() trigger then creates the matching profiles row, which we
 * enrich with the academic fields via the admin's session (profiles_insert/
 * update_admin policies from migration 002).
 */
export async function createStudent(_prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('students', 'add');

  const email = str(fd, 'email').toLowerCase();
  const password = str(fd, 'password');
  const fullName = str(fd, 'full_name');
  const phone = str(fd, 'mobile_number');

  if (!email || !password) return { ok: false, error: 'Email and a temporary password are required.' };
  if (password.length < 8) return { ok: false, error: 'Temporary password must be at least 8 characters.' };

  const iso = createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data: signUp, error: signUpErr } = await iso.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, mobile_number: phone } },
  });
  if (signUpErr || !signUp.user) {
    return { ok: false, error: signUpErr?.message ?? 'Could not create the account.' };
  }

  const uid = signUp.user.id;
  const supabase = createClient();
  const patch = {
    full_name: fullName,
    mobile_number: phone,
    course: nullable(str(fd, 'course')),
    branch: nullable(str(fd, 'branch')),
    year: nullable(str(fd, 'year')),
    gender: nullable(str(fd, 'gender')),
    date_of_birth: nullable(str(fd, 'date_of_birth')),
    location: nullable(str(fd, 'location')),
    is_premium: fd.get('is_premium') === 'on',
  };

  // The trigger inserts the row synchronously, but retry once just in case.
  let updated = await supabase.from('profiles').update(patch).eq('id', uid).select('id');
  if (!updated.data?.length) {
    await new Promise((r) => setTimeout(r, 400));
    updated = await supabase.from('profiles').update(patch).eq('id', uid).select('id');
  }

  await logActivity({
    action: 'student.create',
    module: 'students',
    resourceType: 'profiles',
    resourceId: uid,
    details: { email },
  });

  revalidatePath('/students');
  redirect(`/students/${uid}?created=1`);
}

export async function updateStudent(id: string, _prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('students', 'edit');
  const supabase = createClient();

  const patch = {
    full_name: str(fd, 'full_name'),
    mobile_number: str(fd, 'mobile_number'),
    course: nullable(str(fd, 'course')),
    branch: nullable(str(fd, 'branch')),
    year: nullable(str(fd, 'year')),
    gender: nullable(str(fd, 'gender')),
    date_of_birth: nullable(str(fd, 'date_of_birth')),
    location: nullable(str(fd, 'location')),
    admin_notes: nullable(str(fd, 'admin_notes')),
  };

  const { error } = await supabase.from('profiles').update(patch).eq('id', id);
  if (error) return { ok: false, error: error.message };

  await logActivity({ action: 'student.update', module: 'students', resourceType: 'profiles', resourceId: id });
  revalidatePath(`/students/${id}`);
  redirect(`/students/${id}?saved=1`);
}

export async function setStudentPremium(id: string, isPremium: boolean): Promise<Result> {
  await requirePermission('students', 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('profiles').update({ is_premium: isPremium }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    action: isPremium ? 'student.premium_grant' : 'student.premium_revoke',
    module: 'students',
    resourceType: 'profiles',
    resourceId: id,
  });
  revalidatePath(`/students/${id}`);
  return { ok: true };
}

export async function setStudentStatus(id: string, _prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('students', 'edit');
  const supabase = createClient();
  const block = str(fd, 'action') === 'block';
  const reason = str(fd, 'reason');
  const notes = str(fd, 'notes');

  if (block && !reason) return { ok: false, error: 'A reason is required to block a student.' };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const patch = block
    ? { status: 'blocked', blocked_reason: reason, blocked_at: new Date().toISOString(), blocked_by: user?.id ?? null, admin_notes: notes || null }
    : { status: 'active', blocked_reason: null, blocked_at: null, blocked_by: null };

  const { error } = await supabase.from('profiles').update(patch).eq('id', id);
  if (error) return { ok: false, error: error.message };

  // DB-04: also ban/unban in Supabase Auth so existing sessions stop refreshing. Needs the
  // optional server-only SUPABASE_SERVICE_ROLE_KEY; without it the DB-level block still applies.
  const ban = await setAuthBan(id, block);
  if (ban.status === 'skipped') console.warn(`[students] ${ban.warning}`);
  if (ban.status === 'failed') console.error(`[students] Auth ban/unban failed for ${id}: ${ban.error}`);

  await logActivity({
    action: block ? 'student.block' : 'student.unblock',
    module: 'students',
    resourceType: 'profiles',
    resourceId: id,
    details: { ...(block ? { reason } : {}), auth_ban: ban.status },
  });
  revalidatePath(`/students/${id}`);
  if (ban.status === 'failed') {
    return {
      ok: false,
      error: `Student ${block ? 'blocked' : 'unblocked'} in the database, but the Auth-level ${block ? 'ban' : 'unban'} failed: ${ban.error}`,
    };
  }
  redirect(`/students/${id}?status=1${ban.status === 'skipped' ? '&warn=auth_ban_skipped' : ''}`);
}

export async function adjustStudentWallet(id: string, _prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('students', 'edit');
  const supabase = createClient();

  const mode = str(fd, 'mode'); // 'credit' | 'debit'
  const amount = Number(str(fd, 'amount'));
  const description = str(fd, 'description') || 'Admin wallet adjustment';

  if (!['credit', 'debit'].includes(mode)) return { ok: false, error: 'Choose add or deduct.' };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'Enter a positive amount.' };

  const { error } = await supabase.rpc('admin_adjust_wallet', {
    p_user_id: id,
    p_type: mode,
    p_category: mode === 'credit' ? 'added_money' : 'withdrawal',
    p_amount: amount,
    p_description: description,
  });
  if (error) return { ok: false, error: error.message };

  await logActivity({
    action: 'student.wallet_adjust',
    module: 'students',
    resourceType: 'profiles',
    resourceId: id,
    details: { mode, amount },
  });
  revalidatePath(`/students/${id}/wallet`);
  return { ok: true };
}
