// Pure request handler for POST admin-ban-user. NO Deno globals and NO imports, so the very same file is
// unit-tested under Deno (handler.test.ts) and under jest (mobile-app/tests/unit/edge). index.ts wires the real deps.
//
// Body: { userId: uuid, banned: boolean }  ->  { ok: true } | { ok: false, error }

export const BAN_DURATION = "87600h"; // ~10 years
export const UNBAN_DURATION = "none";

export interface AdminBanDeps {
  /** Resolve the caller from the request's Authorization JWT (verified server-side). null = unauthenticated. */
  getCaller(req: Request): Promise<{ id: string } | null>;
  /** is_admin(auth.uid()) evaluated AS THE CALLER. */
  isAdmin(callerId: string): Promise<boolean>;
  /** has_permission(auth.uid(), module, action) evaluated AS THE CALLER. */
  hasPermission(callerId: string, module: string, action: string): Promise<boolean>;
  /** Role of an ACTIVE admin_users row for `userId`, or null when the user is not an active admin. */
  getActiveAdminRole(userId: string): Promise<string | null>;
  /** auth.admin.updateUserById(userId, { ban_duration }) with the service role. Throws / returns error on failure. */
  setBan(userId: string, banDuration: string): Promise<{ error: unknown | null }>;
}

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
const fail = (status: number, error: string) => respond({ ok: false, error }, status);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function handleAdminBan(req: Request, deps: AdminBanDeps): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail(405, "Method not allowed.");

  try {
    const caller = await deps.getCaller(req);
    if (!caller) return fail(401, "Not authenticated.");

    if (!(await deps.isAdmin(caller.id)) || !(await deps.hasPermission(caller.id, "students", "edit"))) {
      return fail(403, "Forbidden.");
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail(400, "Invalid request body.");
    }
    const { userId, banned } = (body ?? {}) as { userId?: unknown; banned?: unknown };
    if (typeof userId !== "string" || !UUID_RE.test(userId) || typeof banned !== "boolean") {
      return fail(400, "Invalid request body.");
    }

    if (userId.toLowerCase() === caller.id.toLowerCase()) {
      return fail(400, "You cannot ban or unban yourself.");
    }

    // Staff accounts are not students: only a super_admin may ban another super_admin.
    const targetRole = await deps.getActiveAdminRole(userId);
    if (targetRole === "super_admin") {
      const callerRole = await deps.getActiveAdminRole(caller.id);
      if (callerRole !== "super_admin") return fail(403, "Forbidden.");
    }

    const { error } = await deps.setBan(userId, banned ? BAN_DURATION : UNBAN_DURATION);
    if (error) return fail(500, "Could not update the account.");
    return respond({ ok: true }, 200);
  } catch {
    return fail(500, "Could not update the account.");
  }
}
