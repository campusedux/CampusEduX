import { publicReadDeadline } from "@/lib/publicReadDeadline";
import type { getPublicSupabase } from "@/lib/supabase/server";

export type PublicContentScope = "learning" | "blog" | "home";
type Client = NonNullable<ReturnType<typeof getPublicSupabase>>;
const ATTEMPT_TIMEOUT_MS = 2500;

/** Fresh anonymous revision only. Never substitute a stale publication token. */
export async function readPublicContentRevision(client: Client, scope: PublicContentScope, route: string): Promise<string | null> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const started = Date.now();
    const controller = new AbortController();
    let message = "Revision request timed out or transport failed";
    let code: string | undefined;
    try {
      const { data, error } = await publicReadDeadline(
        () => client.rpc("public_content_revision", { p_scope: scope }).abortSignal(controller.signal),
        ATTEMPT_TIMEOUT_MS,
      );
      // Existing app-first migration/rollback compatibility: fresh reads, no reuse.
      if (error?.code === "PGRST202" || error?.code === "42883") return null;
      if (!error && typeof data === "string" && /^[0-9a-f-]{36}$/i.test(data)) return data;
      // Do not log raw upstream messages: they can contain URLs, SQL or credentials.
      code = error?.code && /^[A-Z0-9]{5,12}$/.test(error.code) ? error.code : undefined;
      message = error ? "Revision RPC failed" : "Revision RPC returned an invalid token";
    } catch {
      // Sanitized transport diagnostic; never serialize the client or thrown object.
    } finally {
      controller.abort();
    }
    console.error(JSON.stringify({ event: "public_content_revision_failed", route, scope,
      message, code, duration_ms: Date.now() - started, attempt }));
  }
  throw new Error("Public content revision is unavailable");
}

export function publicRevisionScopes(path: string): PublicContentScope[] {
  if (path === "/") return ["home", "learning", "blog"];
  if (/^\/blog(?:\/|$)/.test(path)) return ["blog"];
  if (/^\/(?:learning|coding-problems|mock-tests)(?:\/|$)/.test(path) || /^\/placement\/notes(?:\/|$)/.test(path))
    return ["learning"];
  return [];
}
