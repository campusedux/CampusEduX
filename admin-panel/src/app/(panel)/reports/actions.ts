'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

type Result = { ok: boolean; error?: string };

/** Records a report generation in `generated_reports` (module = 'reports'). */
export async function logReport(kind: string, params: Record<string, unknown>, rowCount: number, format: string): Promise<Result> {
  await requirePermission('reports', 'view');
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from('admin_users').select('email').eq('id', user?.id ?? '').maybeSingle();
  const { error } = await supabase.from('generated_reports').insert({
    kind,
    module: 'reports',
    params,
    format: format || 'csv',
    row_count: rowCount,
    created_by: user?.id ?? null,
    created_by_email: me?.email ?? '',
  });
  if (error && error.code !== 'PGRST205') return { ok: false, error: error.message };
  await logActivity({ action: 'report.generate', module: 'reports', resourceType: 'generated_reports', details: { kind, format, rowCount } });
  revalidatePath('/reports');
  return { ok: true };
}

export async function deleteGeneratedReport(id: string): Promise<Result> {
  await requirePermission('reports', 'view');
  const supabase = createClient();
  const { error } = await supabase.from('generated_reports').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/reports');
  return { ok: true };
}
