import { NextResponse } from "next/server";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";

/**
 * Signed-in learner's per-topic progress for one Learning grid, for the
 * `ProgressSummary` client island on the (public, ISR) grid page. Runs as the
 * caller's own session, so `learning_progress_summary()` RLS/ownership is
 * unchanged. Per-user: `private, no-store`, never shared-cached.
 */
export const dynamic = "force-dynamic";

const PRIVATE = { "Cache-Control": "private, no-store" } as const;
const SLUG = /^[a-z0-9][a-z0-9-]{0,99}$/i;

export async function GET(req: Request) {
  const grid = new URL(req.url).searchParams.get("grid") ?? "";
  if (!SLUG.test(grid)) return NextResponse.json({ topics: [] }, { status: 400, headers: PRIVATE });

  const supabase = await createAuthedServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ topics: [] }, { status: 401, headers: PRIVATE });

  const { data , error } = await supabase.rpc("learning_progress_summary", { p_grid_slug: grid, p_platform: "website" });
  if (error) return NextResponse.json({ error: "Progress is unavailable. Please retry." }, { status: 503, headers: PRIVATE });
  return NextResponse.json({ topics: Array.isArray(data?.topics) ? data.topics : [] }, { headers: PRIVATE });
}
