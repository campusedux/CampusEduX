// Supabase clients for Edge Functions.
//
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected into
// every function's environment automatically by the platform.

import {
  createClient,
  type SupabaseClient,
  type User,
} from "https://esm.sh/@supabase/supabase-js@2.57.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

/**
 * Service-role client. Bypasses RLS entirely — only use it for the specific
 * rows the function has already authorised, and never return arbitrary rows
 * straight back to the caller.
 */
export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Resolves the calling user from the `Authorization: Bearer <jwt>` header that
 * supabase-js attaches to every functions.invoke() call. Returns null when the
 * request is unauthenticated or the token is invalid/expired.
 */
export async function getUser(req: Request): Promise<User | null> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return null;

  const scoped = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await scoped.auth.getUser(jwt);
  if (error || !data.user) return null;
  return data.user;
}
