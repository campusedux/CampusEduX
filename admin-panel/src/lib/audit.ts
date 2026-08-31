import { createClient } from '@/lib/supabase/server';
import type { ModuleKey } from '@/lib/permissions';

/**
 * Every mutating Server Action calls this right after a successful write so
 * there's a durable trail of who changed what (surfaced in Dashboard →
 * Activity Logs and Settings → System Logs).
 *
 * It routes through the `log_admin_activity()` SECURITY DEFINER function
 * rather than a direct insert: `admin_activity_logs` has no client INSERT
 * policy, so an admin's own session can't forge or tamper with the trail —
 * the function stamps `actor_id = auth.uid()` itself. If the function isn't
 * deployed yet the call is a no-op (logging must never break the action).
 */
export async function logActivity(params: {
  action: string;
  module: ModuleKey | string;
  resourceType?: string | null;
  resourceId?: string | null;
  details?: unknown;
}): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc('log_admin_activity', {
      p_action: params.action,
      p_module: params.module,
      p_resource_type: params.resourceType ?? null,
      p_resource_id: params.resourceId ?? null,
      p_details: params.details ?? null,
    });
    if (error && error.code !== 'PGRST202' && error.code !== 'PGRST205') {
      console.warn('[admin] logActivity error:', error.code, error.message);
    }
  } catch (e) {
    console.warn('[admin] logActivity threw:', (e as Error).message);
  }
}
