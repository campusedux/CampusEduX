// Server-only: uses cookie-bound / anon Supabase clients. Imported only from
// Server Components (the estimate + checkout pages).
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { getPublicSupabase } from "@/lib/supabase/server";
import {
  type BuilderDraft,
  type FeatureRow,
  type PlatformRow,
  type PricingRow,
  computeEstimate,
  emptyDraft,
  normalizeDraft,
} from "@/lib/customProjects";

/** The signed-in user's saved builder draft (custom_project_drafts, RLS = owner). */
export async function loadDraftServer(userId: string): Promise<BuilderDraft> {
  const supabase = createAuthedServerSupabase();
  const { data } = await supabase
    .from("custom_project_drafts")
    .select("payload")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.payload ? normalizeDraft(data.payload) : emptyDraft();
}

/**
 * The draft + an estimate recomputed on the server from the live catalog
 * tables — the number shown to the student is never a client total. (The
 * charged token is separately re-derived by create-custom-project-order.)
 */
export async function loadDraftWithEstimate(userId: string) {
  const draft = await loadDraftServer(userId);

  const pub = getPublicSupabase();
  let pricing: PricingRow[] = [];
  let platforms: PlatformRow[] = [];
  let features: FeatureRow[] = [];
  if (pub) {
    const [pr, pl, ft] = await Promise.all([
      pub.from("custom_project_pricing").select("project_type,project_level,base_price,token_amount,pricing_version").eq("is_active", true),
      pub.from("custom_project_platform_pricing").select("platform,label,charge,sort_order").eq("is_active", true).order("sort_order"),
      pub.from("custom_project_features").select("id,name,description,category,project_types,project_levels,price,sort_order").eq("is_active", true),
    ]);
    pricing = (pr.data ?? []) as PricingRow[];
    platforms = (pl.data ?? []) as PlatformRow[];
    features = (ft.data ?? []) as FeatureRow[];
  }

  return { draft, estimate: computeEstimate(draft, pricing, platforms, features), catalogAvailable: !!pub };
}
