import { createBrowserClient } from "@supabase/ssr";

// Same pattern as admin-panel/src/lib/supabase/client.ts — a real, cookie-backed
// session client for use in Client Components (forms, wallet top-up, premium
// checkout). RLS is always enforced; there is no service-role usage anywhere
// in this website.
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
