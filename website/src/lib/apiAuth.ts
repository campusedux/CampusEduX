import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";

/**
 * Resolve the caller for an API route: `Authorization: Bearer <supabase JWT>`
 * (mobile) OR the cookie session (website). A Bearer header that Supabase
 * rejects is "unauthenticated" — it never silently falls back to the cookie.
 * The returned client always runs as that user (RLS + auth.uid() apply).
 */
export interface ApiCaller {
  user: User;
  supabase: SupabaseClient;
}

export async function resolveApiCaller(req: Request): Promise<ApiCaller | null> {
  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length).trim();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!token || !url || !anonKey) return null;
    const client = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) return null;
    return { user: data.user, supabase: client };
  }
  const supabase = createAuthedServerSupabase() as unknown as SupabaseClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { user, supabase } : null;
}

/**
 * Server-only secret that gates the hidden-test-case RPCs
 * (`practice_problem_run_cases` / `coding_problem_run_cases`, trailing
 * `p_secret text`). Returns null when unset — callers fail closed with 503.
 */
export function judgeRpcSecret(): string | null {
  const s = process.env.JUDGE_RPC_SECRET;
  return s && s.trim() ? s : null;
}

/**
 * Auth is REQUIRED for the compiler by default (WEB-01). Only an explicit
 * `COMPILER_REQUIRE_AUTH=false` disables it (local dev / demos).
 */
export function compilerAuthRequired(): boolean {
  return (process.env.COMPILER_REQUIRE_AUTH ?? "").trim().toLowerCase() !== "false";
}
