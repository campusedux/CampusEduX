import { cache } from "react";
import { createHash } from "node:crypto";
import { getPublicSupabase } from "@/lib/supabase/server";
import { RevisionCache } from "@/lib/revisionCache";

type Scope = "learning" | "blog" | "home";
type Client = NonNullable<ReturnType<typeof getPublicSupabase>>;
const payloads = new RevisionCache();

async function revision(client: Client, scope: Scope): Promise<string | null> {
  const { data, error } = await client.rpc("public_content_revision", { p_scope: scope });
  // Compatibility before the prepared migration (or during rollback). No reuse.
  if (error?.code === "PGRST202" || error?.code === "42883") return null;
  if (error || typeof data !== "string" || !/^[0-9a-f-]{36}$/i.test(data))
    throw new Error("Public content revision is unavailable");
  return data;
}

// Primitive arguments keep this scoped to one environment + React render.
const renderRevision = cache(async (scope: Scope, _identity: string) => {
  const client = getPublicSupabase({ fresh: true });
  if (!client) throw new Error("Public content is unavailable");
  return revision(client, scope);
});

/** Only anonymous projections. Authenticated clients cannot be supplied here.
 * Every render checks the primary DB; a fill is checked again before admission.
 * A write overlapping a read may linearize after its initial revision snapshot.
 * Process restarts/evictions cause cold reads; this is not Next/CDN/HTML caching.
 */
export function revisionedPublicRead<A extends unknown[], R>(
  scope: Scope,
  name: string,
  read: (client: Client, ...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  return cache(async (...args: A): Promise<R> => {
    const client = getPublicSupabase({ fresh: true });
    if (!client) throw new Error("Public content is unavailable");
    const identity = createHash("sha256").update(JSON.stringify([
      process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ])).digest("hex");
    const token = await renderRevision(scope, identity);
    if (token === null) return read(client, ...args);
    const key = JSON.stringify(["public-v1", "website", "anon", identity, scope, name, args, token]);
    return payloads.read(key, async () => {
      const result = await read(client, ...args);
      // Reject the render rather than retry with memoized dependencies from a
      // different revision (e.g. Blog category resolution). Next render retries.
      if (await revision(client, scope) !== token)
        throw new Error("Public content changed during read; retry the request");
      return result;
    });
  });
}
