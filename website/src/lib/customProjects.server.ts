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
  const { draft } = await loadDraftWithMeta(userId);
  return draft;
}

/** The draft plus its own `updated_at` (real, persisted — used for a "saved" timestamp, never a fabricated id). */
async function loadDraftWithMeta(userId: string): Promise<{ draft: BuilderDraft; updatedAt: string | null }> {
  const supabase = createAuthedServerSupabase();
  const { data } = await supabase
    .from("custom_project_drafts")
    .select("payload,updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  return {
    draft: data?.payload ? normalizeDraft(data.payload) : emptyDraft(),
    updatedAt: data?.updated_at ?? null,
  };
}

/** The three public catalog tables the estimate is priced from — one place so no page hand-rolls its own copy of these queries. */
export async function loadCatalog(): Promise<{
  pricing: PricingRow[];
  platforms: PlatformRow[];
  features: FeatureRow[];
  catalogAvailable: boolean;
}> {
  const pub = getPublicSupabase();
  let pricing: PricingRow[] = [];
  let platforms: PlatformRow[] = [];
  let features: FeatureRow[] = [];
  if (pub) {
    const [pr, pl, ft] = await Promise.all([
      pub.from("custom_project_pricing").select("project_type,project_level,base_price,token_amount,pricing_version").eq("is_active", true),
      pub.from("custom_project_platform_pricing").select("platform,label,charge,sort_order").eq("is_active", true).order("sort_order"),
      pub
        .from("custom_project_features")
        .select("id,name,description,category,project_types,project_levels,included_in_levels,price,sort_order,icon,dependencies,conflicts")
        .eq("is_active", true),
    ]);
    pricing = (pr.data ?? []) as PricingRow[];
    platforms = (pl.data ?? []) as PlatformRow[];
    features = ((ft.data ?? []) as (FeatureRow & { conflicts?: string[] })[]).map((f) => ({
      ...f,
      dependencies: f.dependencies ?? [],
      conflicts: f.conflicts ?? [],
      included_in_levels: f.included_in_levels ?? [],
    }));
  }
  return { pricing, platforms, features, catalogAvailable: !!pub };
}

/**
 * The draft + an estimate recomputed on the server from the live catalog
 * tables — the number shown to the student is never a client total. (The
 * charged token is separately re-derived by create-custom-project-order.)
 */
export async function loadDraftWithEstimate(userId: string) {
  const [{ draft, updatedAt }, { pricing, platforms, features, catalogAvailable }] = await Promise.all([
    loadDraftWithMeta(userId),
    loadCatalog(),
  ]);

  return {
    draft,
    draftUpdatedAt: updatedAt,
    estimate: computeEstimate(draft, pricing, platforms, features),
    catalogAvailable,
  };
}
