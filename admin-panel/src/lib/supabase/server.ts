import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Every query built with this client runs as the signed-in admin's own
 * session — RLS and role_permissions (see supabase/migrations/001-002) are
 * always enforced. There is no "admin bypass" client used for reads; the one
 * service-role client (admin.ts) is reserved for the few actions RLS
 * deliberately routes through a SECURITY DEFINER function instead.
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
