import { NextResponse } from "next/server";
import { resolveApiCaller } from "@/lib/apiAuth";

/**
 * GET /api/problems/solution?kind=coding|practice&slug=<slug>
 *
 * The problem pages are rendered from the anonymous, cached read layer, so they can never carry
 * per-user data. `solution_code` is returned by `coding_problem_detail` / `practice_problem_detail`
 * only to an admin or a caller with at least one recorded submission for the problem
 * (migration 0120/092), so the page fetches it here, as the signed-in user, after load.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(req: Request) {
  const caller = await resolveApiCaller(req);
  if (!caller) return NextResponse.json({ ok: false, error: "Sign in to view the solution." }, { status: 401, headers: NO_STORE });

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  const slug = (url.searchParams.get("slug") ?? "").trim().toLowerCase();
  if ((kind !== "coding" && kind !== "practice") || !/^[a-z0-9-]{1,200}$/.test(slug)) {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400, headers: NO_STORE });
  }

  const { data, error } = await caller.supabase.rpc(kind === "coding" ? "coding_problem_detail" : "practice_problem_detail", {
    p_slug: slug,
    p_platform: "website",
  });
  if (error || !data) return NextResponse.json({ ok: false, error: "Not available." }, { status: 404, headers: NO_STORE });

  const d = data as { solution_code?: Record<string, string>; solution_locked?: boolean };
  return NextResponse.json(
    { ok: true, solution_code: d.solution_code ?? {}, solution_locked: d.solution_locked === true },
    { headers: NO_STORE },
  );
}
