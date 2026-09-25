// Deno tests: `deno test supabase/functions/admin-ban-user/handler.test.ts`
// (a jest twin of these cases lives in mobile-app/tests/unit/edge/adminBanHandler.test.ts)
import { assertEquals } from "jsr:@std/assert@1";
import { handleAdminBan, type AdminBanDeps } from "./handler.ts";

const CALLER = "11111111-1111-4111-8111-111111111111";
const TARGET = "22222222-2222-4222-8222-222222222222";

function deps(over: Partial<AdminBanDeps> = {}) {
  const calls: [string, string][] = [];
  const d: AdminBanDeps = {
    getCaller: () => Promise.resolve({ id: CALLER }),
    isAdmin: () => Promise.resolve(true),
    hasPermission: () => Promise.resolve(true),
    getActiveAdminRole: (id) => Promise.resolve(id === CALLER ? "admin" : null),
    setBan: (u, d) => {
      calls.push([u, d]);
      return Promise.resolve({ error: null });
    },
    ...over,
  };
  return { d, calls };
}
const req = (body: unknown) =>
  new Request("http://x/admin-ban-user", {
    method: "POST",
    headers: { Authorization: "Bearer t", "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

Deno.test("no/invalid JWT -> 401", async () => {
  const { d, calls } = deps({ getCaller: () => Promise.resolve(null) });
  assertEquals((await handleAdminBan(req({ userId: TARGET, banned: true }), d)).status, 401);
  assertEquals(calls.length, 0);
});
Deno.test("non-admin -> 403", async () => {
  const { d, calls } = deps({ isAdmin: () => Promise.resolve(false) });
  assertEquals((await handleAdminBan(req({ userId: TARGET, banned: true }), d)).status, 403);
  assertEquals(calls.length, 0);
});
Deno.test("admin without students:edit -> 403", async () => {
  const { d, calls } = deps({ hasPermission: () => Promise.resolve(false) });
  assertEquals((await handleAdminBan(req({ userId: TARGET, banned: true }), d)).status, 403);
  assertEquals(calls.length, 0);
});
Deno.test("bad body -> 400", async () => {
  const { d } = deps();
  for (const b of ["not json", {}, { userId: "nope", banned: true }, { userId: TARGET, banned: "yes" }]) {
    assertEquals((await handleAdminBan(req(b), d)).status, 400);
  }
});
Deno.test("self-ban -> 400", async () => {
  const { d, calls } = deps();
  assertEquals((await handleAdminBan(req({ userId: CALLER, banned: true }), d)).status, 400);
  assertEquals(calls.length, 0);
});
Deno.test("non-super admin cannot ban a super_admin -> 403; super_admin can", async () => {
  const roles: Record<string, string> = { [TARGET]: "super_admin", [CALLER]: "admin" };
  const a = deps({ getActiveAdminRole: (id) => Promise.resolve(roles[id] ?? null) });
  assertEquals((await handleAdminBan(req({ userId: TARGET, banned: true }), a.d)).status, 403);
  roles[CALLER] = "super_admin";
  assertEquals((await handleAdminBan(req({ userId: TARGET, banned: true }), a.d)).status, 200);
});
Deno.test("ban and unban call setBan correctly", async () => {
  const { d, calls } = deps();
  const r = await handleAdminBan(req({ userId: TARGET, banned: true }), d);
  assertEquals(r.status, 200);
  assertEquals(await r.json(), { ok: true });
  await handleAdminBan(req({ userId: TARGET, banned: false }), d);
  assertEquals(calls, [[TARGET, "87600h"], [TARGET, "none"]]);
});
Deno.test("service error -> generic 500", async () => {
  const { d } = deps({ setBan: () => Promise.resolve({ error: new Error("secret internals") }) });
  const r = await handleAdminBan(req({ userId: TARGET, banned: true }), d);
  assertEquals(r.status, 500);
  assertEquals((await r.text()).includes("secret"), false);
});
Deno.test("OPTIONS preflight -> 200", async () => {
  const { d } = deps();
  assertEquals((await handleAdminBan(new Request("http://x", { method: "OPTIONS" }), d)).status, 200);
});
