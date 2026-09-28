import { createClient } from '@/lib/supabase/server';
import { safe } from '@/lib/utils';
import { MODULES, type PermissionMatrix, permsFor, type AdminRole } from '@/lib/permissions';

export const LOG_PAGE_SIZE = 25;

export async function getSiteSettings() {
  const supabase = createClient();
  const { data } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
  return (
    (data as any) ?? {
      site_name: 'CampusEduX',
      tagline: '',
      admin_email: '',
      support_email: '',
      contact_phone: '',
      logo_url: null,
      favicon_url: null,
      social_links: {},
      maintenance_mode: false,
      email_notifications: true,
      user_registration: true,
      allow_guest_access: false,
    }
  );
}

export async function getCourses() {
  const supabase = createClient();
  return safe(
    supabase.from('courses').select('id, name, code, status, sort_order').order('sort_order'),
    [] as any[],
  );
}
export async function getBranches(courseId?: string) {
  const supabase = createClient();
  let query = supabase.from('branches').select('id, course_id, name, code, status, sort_order').order('sort_order');
  if (courseId) query = query.eq('course_id', courseId);
  return safe(query, [] as any[]);
}
export async function getAcademicYears() {
  const supabase = createClient();
  return safe(
    supabase.from('academic_years').select('id, label, status, sort_order').order('sort_order'),
    [] as any[],
  );
}

export async function listAdminUsers() {
  const supabase = createClient();
  return safe(
    supabase
      .from('admin_users')
      .select('id, email, full_name, phone, role, status, last_login_at, created_at')
      .order('created_at', { ascending: false }),
    [] as any[],
  );
}

/** DB matrix for one role, overlaid on the static defaults. */
export async function getRoleMatrix(role: AdminRole): Promise<PermissionMatrix> {
  const supabase = createClient();
  const base = permsFor(role);
  const { data } = await supabase
    .from('role_permissions')
    .select('module, can_view, can_add, can_edit, can_delete')
    .eq('role', role);
  const out = {} as PermissionMatrix;
  for (const m of MODULES) out[m] = { ...base[m] };
  for (const r of data ?? []) {
    if (!(MODULES as readonly string[]).includes(r.module)) continue;
    out[r.module as (typeof MODULES)[number]] = {
      view: Boolean(r.can_view),
      add: Boolean(r.can_add),
      edit: Boolean(r.can_edit),
      delete: Boolean(r.can_delete),
    };
  }
  return out;
}

export async function getBackups() {
  const supabase = createClient();
  return safe(
    supabase.from('backups').select('id, status, size_bytes, note, download_url, created_by_email, created_at').order('created_at', { ascending: false }).limit(50),
    [] as any[],
  );
}

export async function listSystemLogs(opts: { page: number; q?: string; module?: string }) {
  const supabase = createClient();
  const start = (opts.page - 1) * LOG_PAGE_SIZE;
  let query = supabase
    .from('admin_activity_logs')
    .select('id, actor_email, action, module, resource_type, resource_id, ip_address, created_at', { count: 'estimated' })
    .order('created_at', { ascending: false })
    .range(start, start + LOG_PAGE_SIZE - 1);
  if (opts.module) query = query.eq('module', opts.module);
  if (opts.q)
    query = query.or(`action.ilike.%${opts.q}%,actor_email.ilike.%${opts.q}%,resource_type.ilike.%${opts.q}%,resource_id.ilike.%${opts.q}%`);
  const { data, count, error } = await query;
  return { rows: error ? [] : (data ?? []), total: error ? 0 : count ?? 0, missing: Boolean(error) };
}
