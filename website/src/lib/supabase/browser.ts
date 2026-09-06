import { createBrowserClient } from "@supabase/ssr";

// Same pattern as admin-panel/src/lib/supabase/client.ts — a real, cookie-backed
// session client for use in Client Components (forms, wallet top-up, premium
// checkout). RLS is always enforced; there is no service-role usage anywhere
// in this website.
//
// Singleton: every caller shares one GoTrueClient + one token-refresh timer +
// one storage listener. `@supabase/ssr`'s `createBrowserClient` already memoises
// internally when it detects a browser, but the exact heuristic has shifted
// across 0.x releases — this module-level cache pins the behaviour regardless.
type BrowserClient = ReturnType<typeof createBrowserClient>;
let client: BrowserClient | undefined;

export function createBrowserSupabase(): BrowserClient {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}
