import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getPublicSupabase } from "@/lib/supabase/server";
import { inWindow } from "@/lib/home";
import { CACHE_TAGS } from "@/lib/cache";

/**
 * Site-wide announcement strip data for `AnnouncementBar` (a client island),
 * so it no longer needs a browser Supabase client.
 *
 * The `announcements` table is anon-readable (RLS `using (true)`) and identical
 * for every visitor, so — unlike `/api/session` — this response is
 * CDN-cacheable: `public, s-maxage=300, stale-while-revalidate=600`. The
 * `unstable_cache` layer additionally spares the origin DB a query per request
 * where there is no shared cache in front (local `next start`, cache-busting
 * clients). An admin edit can push through immediately via
 * `POST /api/revalidate { "tags": ["cms"] }`.
 */

// Runs at the origin on every request that misses the CDN (`s-maxage` header
// below); the `unstable_cache` wrapper then keeps that to one DB query per
// `revalidate` window rather than one per origin hit.
export const dynamic = "force-dynamic";

const getActiveAnnouncement = unstable_cache(
  async (): Promise<{ id: string; title: string; body: string } | null> => {
    const supabase = getPublicSupabase();
    if (!supabase) return null;
    const { data } = await supabase
      .from("announcements")
      .select("id,title,body,status,starts_at,ends_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(5);
    const now = Date.now();
    const first = (data ?? []).find((a) => inWindow(a.starts_at, a.ends_at, now));
    return first ? { id: first.id, title: first.title, body: first.body } : null;
  },
  ["api:active-announcement"],
  { revalidate: 300, tags: [CACHE_TAGS.cms] },
);

export async function GET() {
  const announcement = await getActiveAnnouncement();
  return NextResponse.json(
    { announcement },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
