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
 *
 * DB-04: a user whose profiles.status = 'blocked' is treated as unauthenticated
 * (null -> the existing callers answer 401). Use `getUserOrResponse` when you
 * want the explicit 403 "Account is blocked". The status lookup is one cheap
 * primary-key select; if it errors we fail closed (null).
 */
export async function getUser(req: Request): Promise<User | null> {
  const result = await resolveUser(req);
  return result.kind === "ok" ? result.user : null;
}

/** Like getUser, but distinguishes blocked accounts (403) from unauthenticated (401). */
export async function getUserOrResponse(
  req: Request,
): Promise<{ user: User; response?: undefined } | { user?: undefined; response: Response }> {
  const result = await resolveUser(req);
  if (result.kind === "ok") return { user: result.user };
  const blocked = result.kind === "blocked";
  return {
    response: new Response(
      JSON.stringify({ error: blocked ? "Account is blocked" : "Not authenticated." }),
      {
        status: blocked ? 403 : 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      },
    ),
  };
}

type Resolved = { kind: "ok"; user: User } | { kind: "blocked" } | { kind: "none" };

async function resolveUser(req: Request): Promise<Resolved> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return { kind: "none" };

  const scoped = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await scoped.auth.getUser(jwt);
  if (error || !data.user) return { kind: "none" };

  const { data: profile, error: profileError } = await adminClient()
    .from("profiles")
    .select("status")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profileError) return { kind: "none" }; // fail closed
  if (profile?.status === "blocked") return { kind: "blocked" };
  return { kind: "ok", user: data.user };
}
