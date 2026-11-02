import { NextResponse } from "next/server";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";

/**
 * The minimal session + profile shape the navigation islands need (header auth
 * menu, mobile drawer). Read from the cookie-bound `@supabase/ssr` server
 * session that `middleware.ts` already refreshes on every request — so the
 * client no longer imports `@supabase/supabase-js` (~67 kB gzip) just to show
 * a "Sign in" button vs. an avatar, and the root layout stays static.
 *
 * Per-user: `Cache-Control: private, no-store`. Never CDN/shared-cache this —
 * `/api/announcements` is the anon, cacheable counterpart.
 */
export const dynamic = "force-dynamic";

const PRIVATE = { "Cache-Control": "private, no-store" } as const;

export async function GET() {
  const supabase = await createAuthedServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ profile: null }, { headers: PRIVATE });
  }

  const { data: p , error } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, is_premium, email")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Profile is unavailable. Please retry." }, { status: 503, headers: PRIVATE });
  const entitlement = await supabase.rpc("current_user_is_premium");

  return NextResponse.json(
    {
      profile: {
        id: user.id,
        email: p?.email ?? user.email ?? "",
        fullName: p?.full_name ?? "",
        avatarUrl: p?.avatar_url ?? null,
        isPremium: !entitlement.error && entitlement.data === true,
      },
    },
    { headers: PRIVATE },
  );
}
