import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Every query built with this client runs as the signed-in admin's own
 * session — RLS and role_permissions (see supabase/migrations/001-002) are
 * always enforced. This build ships NO service-role client at all: the few
 * privileged actions (wallet adjustments, refunds, withdrawals, bulk
 * notifications) go through SECURITY DEFINER RPCs called on this same
 * session client (e.g. supabase.rpc('admin_adjust_wallet', …)).
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component during render — middleware
            // refreshes the session instead, so this is safe to ignore.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // See above.
          }
        },
      },
    },
  );
}
