// Server-only: uses cookie-bound / anon Supabase clients. Imported only from
// Server Components (the estimate + checkout pages).
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { getPublicSupabase } from "@/lib/supabase/server";
import { CustomProjectReadError, readCustomProject } from "@/lib/customProjectReads";
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
  const supabase = await createAuthedServerSupabase();
  const data = await readCustomProject((signal) => supabase
    .from("custom_project_drafts")
    .select("payload,updated_at")
    .eq("user_id", userId)
    .abortSignal(signal).maybeSingle());
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
  if (!pub) throw new CustomProjectReadError("unavailable");
  const [pr, pl, ft] = await Promise.all([
    readCustomProject((signal) => pub.from("custom_project_pricing").select("project_type,project_level,base_price,token_amount,pricing_version").eq("is_active", true).abortSignal(signal)),
    readCustomProject((signal) => pub.from("custom_project_platform_pricing").select("platform,label,charge,sort_order").eq("is_active", true).order("sort_order").abortSignal(signal)),
    readCustomProject((signal) => pub
      .from("custom_project_features")
      .select("id,name,description,category,project_types,project_levels,included_in_levels,price,sort_order,icon,dependencies,conflicts")
      .eq("is_active", true).abortSignal(signal)),
  ]);
  // [] is a valid empty catalog; a missing response is not.
  if (!pr || !pl || !ft) throw new CustomProjectReadError("unavailable");
  const pricing = pr as PricingRow[];
  const platforms = pl as PlatformRow[];
  const features = (ft as (FeatureRow & { conflicts?: string[] })[]).map((f) => ({
    ...f,
    dependencies: f.dependencies ?? [],
    conflicts: f.conflicts ?? [],
    included_in_levels: f.included_in_levels ?? [],
  }));
  return { pricing, platforms, features, catalogAvailable: true };
}

/**
 * The draft + an estimate recomputed on the server from the live catalog
 * tables — the number shown to the student is never a client total. (The
 * charged token is separately re-derived by create-custom-project-order.)
 */
export async function loadDraftWithEstimate(userId: string) {
  const [{ draft, updatedAt }, catalog] = await Promise.all([
    loadDraftWithMeta(userId),
    loadCatalog(),
  ]);
  const { pricing, platforms, features, catalogAvailable } = catalog;

  // A configured selection cannot be quoted without its actual catalog rows.
  if ((draft.projectType && draft.projectLevel && !pricing.some((row) => row.project_type === draft.projectType && row.project_level === draft.projectLevel)) ||
      (draft.platform && !platforms.some((row) => row.platform === draft.platform))) {
    throw new CustomProjectReadError("unavailable");
  }
  return {
    draft,
    draftUpdatedAt: updatedAt,
    estimate: computeEstimate(draft, pricing, platforms, features),
    catalogAvailable,
    catalog,
  };
}
