// POST admin-ban-user
//
// Called by the admin panel's block/unblock student action (via supabase.functions.invoke with the admin's session).
//
// Request  body : { userId: uuid, banned: boolean }
// Response body : { ok: true } | { ok: false, error }
//
// Bans / unbans a user in Supabase Auth (ban_duration) so existing sessions stop refreshing. This needs the
// service-role key, which is injected into every Edge Function by the platform — that is why this lives here and
// NOT in the admin panel (which deliberately has no service-role key). The caller must be an active admin holding
// students:edit; those checks run as the CALLER via is_admin()/has_permission(). profiles.status is NOT touched
// here: the admin action sets it first and the DB-level block stays the primary enforcement.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { adminClient } from "../_shared/client.ts";
import { handleAdminBan, type AdminBanDeps } from "./handler.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

function userClient(req: Request) {
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

Deno.serve((req) => {
  // One user-scoped client per request; the caller's JWT is what auth.uid() sees inside the RPCs.
  const uc = userClient(req);
  const deps: AdminBanDeps = {
    async getCaller() {
      const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
      if (!token) return null;
      const { data, error } = await uc.auth.getUser(token);
      return error || !data.user ? null : { id: data.user.id };
    },
    async isAdmin(callerId) {
      const { data, error } = await uc.rpc("is_admin", { uid: callerId });
      return !error && data === true;
    },
    async hasPermission(callerId, module, action) {
      const { data, error } = await uc.rpc("has_permission", {
        p_user_id: callerId,
        p_module: module,
        p_action: action,
      });
      return !error && data === true;
    },
    async getActiveAdminRole(userId) {
      const { data, error } = await adminClient()
        .from("admin_users")
        .select("role")
        .eq("id", userId)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw new Error("admin_users lookup failed"); // fail closed -> generic 500
      return (data?.role as string | undefined) ?? null;
    },
    async setBan(userId, banDuration) {
      const { error } = await adminClient().auth.admin.updateUserById(userId, { ban_duration: banDuration });
      return { error: error ?? null };
    },
  };
  return handleAdminBan(req, deps);
});
