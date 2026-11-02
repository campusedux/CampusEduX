import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Same pattern as admin-panel/src/lib/supabase/server.ts. Every query built
// with this client runs as the signed-in student's own session — RLS is
// always enforced, and this is the only client account pages should use for
// a signed-in user's own rows (purchases, applications, resumes_builder,
// wallet_transactions, referrals, notifications, etc.).
export async function createAuthedServerSupabase() {
  const cookieStore = await cookies();

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
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // See above.
          }
        },
      },
    }
  );
}
