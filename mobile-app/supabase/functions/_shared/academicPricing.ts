// Academic-only Extra Feature price override — mirrors
// website/src/lib/customProjects.ts's `ACADEMIC_EXTRA_FEATURE_PRICES` /
// `priceForFeature` exactly (same ids, same values). Kept as one file under
// `_shared/` so every Edge Function that ever needs to price a selected
// feature reads the identical numbers the website's own Estimate page shows
// the customer — today that's only create-custom-project-order, which is
// where the feature_total / estimated_total snapshot on
// custom_project_requests is first computed and persisted.
//
// WHY THIS EXISTS: `custom_project_features.price` is one flat value shared
// across every `project_types` a feature is offered to, so Personal/Business
// and Academic are quoted the same catalog figure today — correct for
// Personal/Business (left untouched here), far too high for an academic
// assignment. Rather than editing the shared catalog `price` column (which
// would also change Personal/Business), this override is applied ONLY when
// `projectType === "academic"`.
//
// If you change a value here, change the matching entry in
// website/src/lib/customProjects.ts too (and vice versa) — a website test,
// tests/lib/customProjects.test.ts, asserts the two stay in sync.

export const ACADEMIC_EXTRA_FEATURE_PRICES: Record<string, number> = {
  // Non-advanced (₹40–100) ---------------------------------------------
  "doc-viva": 40,
  "media-pdf-upload": 45,
  "doc-ppt": 45,
  "auth-google": 50,
  "pay-history": 50,
  "notif-inapp": 55,
  "media-multi-image": 55,
  "search-filters": 55,
  "doc-documentation": 55,
  "doc-srs": 60,
  "notif-email": 65,
  "doc-project-report": 70,
  "auth-otp": 75,
  "admin-dashboard-basic": 80,
  "notif-push": 80,
  "analytics-dashboard": 85,
  "deploy-web": 85,
  "deploy-support": 95,
  // Advanced (₹100–150) --------------------------------------------------
  "search-advanced": 110,
  "deploy-apk": 120,
  "pay-razorpay": 125,
  "int-rest-api": 130,
  "doc-academic-package": 150,
};

/**
 * The price to charge for `feature` given the active project type. Academic
 * Extra Features (paid, not AI-recommended-as-necessary) use the override
 * above; every Included feature (free, or AI-flagged as necessary) and
 * every Personal/Business feature keep the catalog's own `price` value.
 */
export function priceForFeature(
  feature: { id: string; price: number },
  projectType: string,
  isRecommended: boolean,
): number {
  const catalogPrice = Number(feature.price) || 0;
  if (projectType === "academic" && !isRecommended && catalogPrice > 0) {
    const override = ACADEMIC_EXTRA_FEATURE_PRICES[feature.id];
    if (override !== undefined) return override;
  }
  return catalogPrice;
}
