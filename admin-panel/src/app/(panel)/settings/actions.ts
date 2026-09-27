'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSbClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { urlFieldError } from '@/lib/safeUrl';
import { requirePermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { MODULES, ADMIN_ROLES, type AdminRole } from '@/lib/permissions';
import type { UploadedFile } from '@/components/ui/UploadDropzone';

type Result = { ok: boolean; error?: string };
const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const n = (fd: FormData, k: string) => Number(s(fd, k) || 0);
const slug = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);
const on = (fd: FormData, k: string) => fd.get(k) === 'on';

// --- general settings -------------------------------------------------
export async function saveGeneralSettings(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('settings', 'edit');
  const urlErr = urlFieldError(fd, { logo_url: 'Logo URL', favicon_url: 'Favicon URL', social_twitter: 'Twitter link', social_linkedin: 'LinkedIn link', social_instagram: 'Instagram link', social_youtube: 'YouTube link' });
  if (urlErr) return { ok: false, error: urlErr };
  // Only sent when the form rendered the field (i.e. migration 0129/100 is applied).
  const minVersion = fd.has('min_supported_app_version') ? s(fd, 'min_supported_app_version') || '0.0.0' : null;
  if (minVersion !== null && !/^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(minVersion)) {
    return { ok: false, error: 'Minimum app version must look like 1.2.0.' };
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('site_settings')
    .update({
      ...(minVersion !== null ? { min_supported_app_version: minVersion } : {}),
      site_name: s(fd, 'site_name') || 'CampusEduX',
      tagline: s(fd, 'tagline'),
      admin_email: s(fd, 'admin_email'),
      support_email: s(fd, 'support_email'),
      contact_phone: s(fd, 'contact_phone'),
      logo_url: s(fd, 'logo_url') || null,
      favicon_url: s(fd, 'favicon_url') || null,
      social_links: {
        twitter: s(fd, 'social_twitter'),
        linkedin: s(fd, 'social_linkedin'),
        instagram: s(fd, 'social_instagram'),
        youtube: s(fd, 'social_youtube'),
      },
      maintenance_mode: on(fd, 'maintenance_mode'),
      email_notifications: on(fd, 'email_notifications'),
      user_registration: on(fd, 'user_registration'),
      allow_guest_access: on(fd, 'allow_guest_access'),
      updated_by: user?.id ?? null,
    })
    .eq('id', 1);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'settings.general.save', module: 'settings', resourceType: 'site_settings' });
  revalidatePath('/settings');
  return { ok: true };
}

export async function saveSiteAsset(field: 'logo_url' | 'favicon_url', files: UploadedFile[]): Promise<Result> {
  await requirePermission('settings', 'edit');
  if (!files.length) return { ok: false, error: 'No file uploaded.' };
  const supabase = createClient();
  const { error } = await supabase.from('site_settings').update({ [field]: files[0].url }).eq('id', 1);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/settings');
  return { ok: true };
}

// --- courses / branches / years -------------------------------
// Shared guards for the academic catalog (spec §14 duplicate protection,
// §15 safe delete, §17 audit logging). The DB backs these up — migration
// 0035 adds case-insensitive unique indexes and an ON DELETE RESTRICT FK —
// but the pre-checks give a friendly message and work before it is applied.

type AcademicKind = 'course' | 'branch' | 'year';
const ACADEMIC_TABLE: Record<AcademicKind, 'courses' | 'branches' | 'academic_years'> = {
  course: 'courses',
  branch: 'branches',
  year: 'academic_years',
};
const ACADEMIC_PATH: Record<AcademicKind, string> = {
  course: '/settings/courses',
  branch: '/settings/branches',
  year: '/settings/years',
};

/** True when another row of the same kind already carries this name/label
 *  (case-insensitive, whitespace-trimmed). Branches are unique per course. */
async function academicDuplicate(
  supabase: ReturnType<typeof createClient>,
  kind: AcademicKind,
  value: string,
  excludeId: string | null,
  courseId?: string | null,
): Promise<boolean> {
  const field = kind === 'year' ? 'label' : 'name';
  const { data } = await supabase.from(ACADEMIC_TABLE[kind]).select('*');
  const norm = (x: string) => x.trim().toLowerCase();
  return ((data ?? []) as Array<Record<string, string | null>>).some((row) => {
    if (norm(String(row[field] ?? '')) !== norm(value)) return false;
    if (row.id === excludeId) return false;
    if (kind === 'branch' && (row.course_id ?? '') !== (courseId ?? '')) return false;
    return true;
  });
}

/** Non-null message when the row is still referenced and must be deactivated
 *  rather than deleted. Returns null when nothing references it (or when the
 *  academic_usage RPC is not deployed yet — the DB FK is then the backstop). */
async function academicDeleteBlock(
  supabase: ReturnType<typeof createClient>,
  kind: AcademicKind,
  id: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc('academic_usage', { p_kind: kind, p_id: id });
  if (error) return null;
  const u = (Array.isArray(data) ? data[0] : data) as
    | { branches: number; students: number; projects: number; jobs: number; prep_notes: number }
    | null;
  if (!u) return null;
  const parts: string[] = [];
  const add = (count: number, one: string, many: string) => {
    if (count > 0) parts.push(`${count} ${count === 1 ? one : many}`);
  };
  add(u.branches, 'branch', 'branches');
  add(u.students, 'student', 'students');
  add(u.projects, 'project', 'projects');
  add(u.jobs, 'job', 'jobs');
  add(u.prep_notes, 'note', 'notes');
  return parts.length ? `Still referenced by ${parts.join(', ')}. Deactivate it instead of deleting.` : null;
}

async function saveAcademic(
  kind: AcademicKind,
  id: string | null,
  fd: FormData,
  extra: Record<string, unknown> = {},
): Promise<Result> {
  await requirePermission('settings', id ? 'edit' : 'add');
  const supabase = createClient();
  const field = kind === 'year' ? 'label' : 'name';
  const value = s(fd, field);
  if (!value) return { ok: false, error: `${field === 'label' ? 'Label' : 'Name'} is required.` };

  const courseId = kind === 'branch' ? s(fd, 'course_id') || null : undefined;
  if (await academicDuplicate(supabase, kind, value, id, courseId)) {
    return { ok: false, error: `A ${kind} named “${value}” already exists${kind === 'branch' ? ' for this course' : ''}.` };
  }

  const status = s(fd, 'status') || 'active';
  const patch: Record<string, unknown> = { [field]: value, status, sort_order: n(fd, 'sort_order'), ...extra };

  let prevStatus: string | null = null;
  if (id) {
    const { data: before } = await supabase.from(ACADEMIC_TABLE[kind]).select('status').eq('id', id).maybeSingle();
    prevStatus = (before as { status?: string } | null)?.status ?? null;
  }

  const { error } = id
    ? await supabase.from(ACADEMIC_TABLE[kind]).update(patch).eq('id', id)
    : await supabase
        .from(ACADEMIC_TABLE[kind])
        .insert({ id: `${slug(value)}-${Math.random().toString(36).slice(2, 5)}`, ...patch });
  if (error) {
    return {
      ok: false,
      error: error.code === '23505' ? `A ${kind} named “${value}” already exists.` : error.message,
    };
  }

  const action = !id
    ? `academic.${kind}.create`
    : prevStatus && prevStatus !== status
      ? `academic.${kind}.${status === 'inactive' ? 'deactivate' : 'activate'}`
      : `academic.${kind}.update`;
  await logActivity({ action, module: 'settings', resourceType: ACADEMIC_TABLE[kind], resourceId: id ?? value, details: { status } });
  revalidatePath(ACADEMIC_PATH[kind]);
  return { ok: true };
}

async function deleteAcademic(kind: AcademicKind, id: string): Promise<Result> {
  await requirePermission('settings', 'delete');
  const supabase = createClient();
  const blocked = await academicDeleteBlock(supabase, kind, id);
  if (blocked) return { ok: false, error: blocked };
  const { error } = await supabase.from(ACADEMIC_TABLE[kind]).delete().eq('id', id);
  if (error) {
    return {
      ok: false,
      error:
        error.code === '23503'
          ? 'Still referenced by other records. Deactivate it instead of deleting.'
          : error.message,
    };
  }
  await logActivity({ action: `academic.${kind}.delete`, module: 'settings', resourceType: ACADEMIC_TABLE[kind], resourceId: id });
  revalidatePath(ACADEMIC_PATH[kind]);
  return { ok: true };
}

export async function saveCourse(id: string | null, _p: Result, fd: FormData): Promise<Result> {
  return saveAcademic('course', id, fd, { code: s(fd, 'code') });
}
export async function deleteCourse(id: string): Promise<Result> {
  return deleteAcademic('course', id);
}

export async function saveBranch(id: string | null, _p: Result, fd: FormData): Promise<Result> {
  return saveAcademic('branch', id, fd, { code: s(fd, 'code'), course_id: s(fd, 'course_id') || null });
}
export async function deleteBranch(id: string): Promise<Result> {
  return deleteAcademic('branch', id);
}

export async function saveYear(id: string | null, _p: Result, fd: FormData): Promise<Result> {
  return saveAcademic('year', id, fd);
}
export async function deleteYear(id: string): Promise<Result> {
  return deleteAcademic('year', id);
}

// --- admin users ------------------------------------------
export async function createAdminUser(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('admin_users', 'add');
  const email = s(fd, 'email').toLowerCase();
  const password = s(fd, 'password');
  const fullName = s(fd, 'full_name');
  const role = s(fd, 'role') as AdminRole;
  if (!email || !password) return { ok: false, error: 'Email and a temporary password are required.' };
  if (password.length < 8) return { ok: false, error: 'Temporary password must be at least 8 characters.' };
  if (!ADMIN_ROLES.includes(role)) return { ok: false, error: 'Pick a valid role.' };

  const iso = createSbClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: signUp, error: signUpErr } = await iso.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (signUpErr || !signUp.user) return { ok: false, error: signUpErr?.message ?? 'Could not create the account.' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from('admin_users').insert({
    id: signUp.user.id,
    email,
    full_name: fullName,
    phone: s(fd, 'phone'),
    role,
    status: 'active',
    created_by: user?.id ?? null,
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'admin_user.create', module: 'admin_users', resourceType: 'admin_users', resourceId: signUp.user.id, details: { role } });
  revalidatePath('/settings/admin-users');
  return { ok: true };
}

export async function updateAdminUser(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('admin_users', 'edit');
  const supabase = createClient();
  const role = s(fd, 'role') as AdminRole;
  if (!ADMIN_ROLES.includes(role)) return { ok: false, error: 'Invalid role.' };
  const { error } = await supabase
    .from('admin_users')
    .update({ full_name: s(fd, 'full_name'), phone: s(fd, 'phone'), role, status: s(fd, 'status') || 'active' })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'admin_user.update', module: 'admin_users', resourceType: 'admin_users', resourceId: id });
  revalidatePath('/settings/admin-users');
  return { ok: true };
}

// --- roles & permissions -----------------------------
export async function saveRoleMatrix(role: AdminRole, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('roles', 'edit');
  if (!ADMIN_ROLES.includes(role) || role === 'super_admin') {
    return { ok: false, error: 'super_admin permissions are fixed.' };
  }
  const supabase = createClient();
  const rows = MODULES.map((m) => ({
    role,
    module: m,
    can_view: fd.get(`${m}.view`) === 'on',
    can_add: fd.get(`${m}.add`) === 'on',
    can_edit: fd.get(`${m}.edit`) === 'on',
    can_delete: fd.get(`${m}.delete`) === 'on',
  }));
  const { error } = await supabase.from('role_permissions').upsert(rows, { onConflict: 'role,module' });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'roles.matrix.save', module: 'roles', resourceType: 'role_permissions', resourceId: role });
  revalidatePath('/settings/roles');
  return { ok: true };
}

// --- backup --------------------------------------------
// TODO: this records a backup *request* only — it does not produce a database
// dump or a downloadable artifact (hence status is hard-coded 'completed',
// size_bytes/download_url stay null, and the UI shows "not available"). The
// actual database is backed up by Supabase's own PITR. To make this real:
// trigger pg_dump / the Supabase Management API from a server context, upload
// the result to a private Storage bucket, then write size_bytes + a signed
// download_url back to the row. Left as-is in the Phase 2 cleanup because
// which mechanism to use (and its retention/cost) is a product/ops decision,
// not a code fix. The backup page copy is already honest about the limitation.
export async function createBackup(): Promise<Result> {
  await requirePermission('backup', 'add');
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from('admin_users').select('email').eq('id', user?.id ?? '').maybeSingle();
  const { error } = await supabase.from('backups').insert({
    status: 'completed',
    note: 'Manual snapshot requested from the admin panel',
    created_by: user?.id ?? null,
    created_by_email: me?.email ?? '',
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'backup.create', module: 'backup', resourceType: 'backups' });
  revalidatePath('/settings/backup');
  return { ok: true };
}
