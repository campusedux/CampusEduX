import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Bypasses RLS entirely — never used for reads or for anything a normal
 * role_permissions-gated query could do. Reserved for: approving refunds
 * (routes through reverse_purchase_on_refund, the same SECURITY DEFINER
 * function the Razorpay webhook uses) and minting signed URLs for locked
 * document previews in the project editor. Both actions already re-check
 * the caller's admin/manager role server-side before touching this client —
 * see src/lib/auth.ts.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
