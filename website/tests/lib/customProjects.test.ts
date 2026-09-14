import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  ACADEMIC_EXTRA_FEATURE_PRICES,
  computeEstimate,
  emptyDraft,
  normalizeDraft,
  featuresForTier,
  findConflict,
  priceForFeature,
  resolveDependencies,
  type FeatureRow,
  type PlatformRow,
  type PricingRow,
} from "@/lib/customProjects";

const PRICING: PricingRow[] = [
  { project_type: "academic", project_level: "standard", base_price: 7999, token_amount: 1500, pricing_version: 1 },
  { project_type: "academic", project_level: "advanced", base_price: 9999, token_amount: 1500, pricing_version: 1 },
  { project_type: "business", project_level: "standard", base_price: 29999, token_amount: 6000, pricing_version: 1 },
];

const PLATFORMS: PlatformRow[] = [
  { platform: "web", label: "Web", charge: 0, sort_order: 1 },
  { platform: "android", label: "Android", charge: 1500, sort_order: 2 },
];

const FEATURES: FeatureRow[] = [
  { id: "f-free", name: "Login", description: "", category: "Auth", project_types: ["academic", "business"], project_levels: ["standard", "advanced"], price: 0, sort_order: 10, icon: null, dependencies: [], conflicts: [] },
  { id: "f-paid", name: "Google login", description: "", category: "Auth", project_types: ["academic", "business"], project_levels: ["standard", "advanced"], price: 800, sort_order: 20, icon: null, dependencies: ["f-free"], conflicts: [] },
  { id: "f-biz-only", name: "AI analytics", description: "", category: "AI", project_types: ["business"], project_levels: ["standard", "advanced"], price: 4500, sort_order: 30, icon: null, dependencies: [], conflicts: [] },
  { id: "f-conflict-a", name: "Stripe", description: "", category: "Payments", project_types: ["business"], project_levels: ["standard", "advanced"], price: 900, sort_order: 40, icon: null, dependencies: [], conflicts: ["f-conflict-b"] },
  { id: "f-conflict-b", name: "Razorpay", description: "", category: "Payments", project_types: ["business"], project_levels: ["standard", "advanced"], price: 900, sort_order: 50, icon: null, dependencies: [], conflicts: [] },
];

// Real catalog ids (mobile-app/supabase/migrations/0033) used to exercise the
// Academic Extra Feature price override — one non-advanced, one advanced,
// each also offered to personal/business at their original (unchanged) price.
const REAL_FEATURES: FeatureRow[] = [
  { id: "auth-google", name: "Google login", description: "", category: "Authentication", project_types: ["academic", "personal", "business"], project_levels: ["standard", "advanced"], price: 800, sort_order: 20, icon: null, dependencies: [], conflicts: [] },
  { id: "pay-razorpay", name: "Razorpay integration", description: "", category: "Payments", project_types: ["academic", "personal", "business"], project_levels: ["advanced"], price: 2000, sort_order: 310, icon: null, dependencies: [], conflicts: [] },
  { id: "auth-email-password", name: "Email & password login", description: "", category: "Authentication", project_types: ["academic", "personal", "business"], project_levels: ["standard", "advanced"], price: 0, sort_order: 10, icon: null, dependencies: [], conflicts: [] },
  { id: "not-in-override-map", name: "Some future feature", description: "", category: "General", project_types: ["academic"], project_levels: ["standard", "advanced"], price: 999, sort_order: 900, icon: null, dependencies: [], conflicts: [] },
];

describe("featuresForTier", () => {
  it("returns only features offered for the chosen type + level, sorted", () => {
    const list = featuresForTier(FEATURES, "academic", "standard").map((f) => f.id);
    expect(list).toEqual(["f-free", "f-paid"]); // f-biz-only excluded
  });
  it("is empty until a type + level are chosen", () => {
    expect(featuresForTier(FEATURES, null, "standard")).toEqual([]);
  });
});

describe("computeEstimate", () => {
  it("adds base + eligible feature prices + platform charge", () => {
    const draft = { ...emptyDraft(), projectType: "academic" as const, projectLevel: "standard" as const, platform: "android" as const, title: "Thing", featureIds: ["f-free", "f-paid"] };
    const est = computeEstimate(draft, PRICING, PLATFORMS, FEATURES);
    expect(est.basePrice).toBe(7999);
    expect(est.platformCharge).toBe(1500);
    expect(est.featureTotal).toBe(800);
    expect(est.estimatedTotal).toBe(7999 + 800 + 1500);
    expect(est.ready).toBe(true);
  });

  it("ignores a selected feature that isn't valid for this tier", () => {
    const draft = { ...emptyDraft(), projectType: "academic" as const, projectLevel: "standard" as const, platform: "web" as const, title: "Thing", featureIds: ["f-paid", "f-biz-only"] };
    const est = computeEstimate(draft, PRICING, PLATFORMS, FEATURES);
    // f-biz-only is business-only — must not be priced in for an academic project
    expect(est.selectedFeatures.map((f) => f.id)).toEqual(["f-paid"]);
    expect(est.featureTotal).toBe(800);
  });

  it("takes the token from the fixed per-type constant, not from the estimate or features", () => {
    const draft = { ...emptyDraft(), projectType: "business" as const, projectLevel: "standard" as const, platform: "web" as const, title: "Big", featureIds: ["f-biz-only"] };
    const est = computeEstimate(draft, PRICING, PLATFORMS, FEATURES);
    expect(est.tokenAmount).toBe(6000); // not 6000 + 4500, not a % of estimatedTotal
    expect(est.estimatedTotal).toBe(29999 + 4500);
  });

  it("is not ready until type, level, platform and title are all set", () => {
    const est = computeEstimate({ ...emptyDraft(), projectType: "academic", projectLevel: "standard", platform: "web" }, PRICING, PLATFORMS, FEATURES);
    expect(est.ready).toBe(false); // no title
  });
});

describe("normalizeDraft", () => {
  it("returns an empty draft for junk input", () => {
    expect(normalizeDraft(null)).toEqual(emptyDraft());
    expect(normalizeDraft("nonsense")).toEqual(emptyDraft());
    expect(normalizeDraft(42)).toEqual(emptyDraft());
  });

  it("drops invalid enum values and unknown keys", () => {
    const d = normalizeDraft({ projectType: "spaceship", projectLevel: "advanced", platform: "web", nope: 1, title: "Hi" });
    expect(d.projectType).toBeNull();
    expect(d.projectLevel).toBe("advanced");
    expect(d.platform).toBe("web");
    expect(d.title).toBe("Hi");
    expect("nope" in d).toBe(false);
  });

  it("clamps arrays and keeps only string feature ids", () => {
    const d = normalizeDraft({ featureIds: ["a", 2, "b", null, "c"], customRequirements: [{ text: "  need X " }, { text: "" }, { text: "y" }] });
    expect(d.featureIds).toEqual(["a", "b", "c"]);
    expect(d.customRequirements).toEqual([{ text: "need X" }, { text: "y" }]);
  });

  it("picks up the AI fields and the featuresSeeded flag", () => {
    const d = normalizeDraft({
      aiOverview: "A store for clothes.",
      aiRecommendedFeatureIds: ["f-free", 3, "f-paid"],
      aiSuggestedExtraFeatureIds: ["f-biz-only"],
      featuresSeeded: true,
    });
    expect(d.aiOverview).toBe("A store for clothes.");
    expect(d.aiRecommendedFeatureIds).toEqual(["f-free", "f-paid"]);
    expect(d.aiSuggestedExtraFeatureIds).toEqual(["f-biz-only"]);
    expect(d.featuresSeeded).toBe(true);
  });

  it("defaults featuresSeeded to false for anything that isn't literally true", () => {
    expect(normalizeDraft({ featuresSeeded: "true" }).featuresSeeded).toBe(false);
    expect(emptyDraft().featuresSeeded).toBe(false);
  });
});

describe("resolveDependencies", () => {
  it("auto-adds a missing dependency and reports it", () => {
    const { featureIds, added } = resolveDependencies([], "f-paid", FEATURES);
    expect(featureIds).toEqual(["f-free"]);
    expect(added.map((f) => f.id)).toEqual(["f-free"]);
  });

  it("adds nothing when the dependency is already enabled", () => {
    const { featureIds, added } = resolveDependencies(["f-free"], "f-paid", FEATURES);
    expect(featureIds).toEqual(["f-free"]);
    expect(added).toEqual([]);
  });

  it("is a no-op for a feature with no dependencies", () => {
    const { featureIds, added } = resolveDependencies(["x"], "f-free", FEATURES);
    expect(featureIds).toEqual(["x"]);
    expect(added).toEqual([]);
  });
});

describe("findConflict", () => {
  it("finds a conflict declared on the feature being enabled", () => {
    const conflict = findConflict(["f-conflict-b"], "f-conflict-a", FEATURES);
    expect(conflict?.id).toBe("f-conflict-b");
  });

  it("also finds a conflict declared on the other side (symmetric)", () => {
    // f-conflict-b doesn't declare the conflict itself — f-conflict-a does.
    const conflict = findConflict(["f-conflict-a"], "f-conflict-b", FEATURES);
    expect(conflict?.id).toBe("f-conflict-a");
  });

  it("returns null when nothing conflicts", () => {
    expect(findConflict(["f-free"], "f-paid", FEATURES)).toBeNull();
  });
});

// The 5 features whose seeded catalog price/name trip the "advanced" backfill
// rule from mobile-app/supabase/migrations/0034 (price >= 2000, or the name
// contains "advanced") — every other override entry is non-advanced.
const ADVANCED_ACADEMIC_FEATURE_IDS = ["search-advanced", "deploy-apk", "pay-razorpay", "int-rest-api", "doc-academic-package"];

describe("priceForFeature — Academic Extra Feature pricing", () => {
  it("1. re-prices a non-advanced Academic Extra Feature into the ₹40–100 band", () => {
    const googleLogin = REAL_FEATURES.find((f) => f.id === "auth-google")!;
    const price = priceForFeature(googleLogin, "academic", false);
    expect(price).toBe(ACADEMIC_EXTRA_FEATURE_PRICES["auth-google"]);
    expect(price).toBeGreaterThanOrEqual(40);
    expect(price).toBeLessThanOrEqual(100);
    expect(price).not.toBe(googleLogin.price); // no longer the shared catalog price
  });

  it("2. re-prices an advanced Academic Extra Feature into the ₹100–150 band", () => {
    const razorpay = REAL_FEATURES.find((f) => f.id === "pay-razorpay")!;
    const price = priceForFeature(razorpay, "academic", false);
    expect(price).toBe(ACADEMIC_EXTRA_FEATURE_PRICES["pay-razorpay"]);
    expect(price).toBeGreaterThanOrEqual(100);
    expect(price).toBeLessThanOrEqual(150);
    expect(price).not.toBe(razorpay.price);
  });

  it("3. Academic multiple Extra Features each resolve to their own override price", () => {
    const googleLogin = REAL_FEATURES.find((f) => f.id === "auth-google")!;
    const razorpay = REAL_FEATURES.find((f) => f.id === "pay-razorpay")!;
    const total =
      priceForFeature(googleLogin, "academic", false) + priceForFeature(razorpay, "academic", false);
    expect(total).toBe(ACADEMIC_EXTRA_FEATURE_PRICES["auth-google"] + ACADEMIC_EXTRA_FEATURE_PRICES["pay-razorpay"]);
  });

  it("4. Personal Extra Feature pricing is unchanged (still the catalog price)", () => {
    const googleLogin = REAL_FEATURES.find((f) => f.id === "auth-google")!;
    const razorpay = REAL_FEATURES.find((f) => f.id === "pay-razorpay")!;
    expect(priceForFeature(googleLogin, "personal", false)).toBe(800);
    expect(priceForFeature(razorpay, "personal", false)).toBe(2000);
  });

  it("5. Business Extra Feature pricing is unchanged (still the catalog price)", () => {
    const googleLogin = REAL_FEATURES.find((f) => f.id === "auth-google")!;
    const razorpay = REAL_FEATURES.find((f) => f.id === "pay-razorpay")!;
    expect(priceForFeature(googleLogin, "business", false)).toBe(800);
    expect(priceForFeature(razorpay, "business", false)).toBe(2000);
  });

  it("6. every Academic Extra Feature price sits inside its ₹40–150 boundary", () => {
    for (const [id, price] of Object.entries(ACADEMIC_EXTRA_FEATURE_PRICES)) {
      expect(price, id).toBeGreaterThanOrEqual(40);
      expect(price, id).toBeLessThanOrEqual(150);
      if (ADVANCED_ACADEMIC_FEATURE_IDS.includes(id)) {
        expect(price, `${id} (advanced)`).toBeGreaterThanOrEqual(100);
        expect(price, `${id} (advanced)`).toBeLessThanOrEqual(150);
      } else {
        expect(price, `${id} (non-advanced)`).toBeGreaterThanOrEqual(40);
        expect(price, `${id} (non-advanced)`).toBeLessThanOrEqual(100);
      }
    }
  });

  it("7. computeEstimate includes the Academic-adjusted price, not the catalog price", () => {
    const draft = {
      ...emptyDraft(),
      projectType: "academic" as const,
      projectLevel: "advanced" as const,
      platform: "web" as const,
      title: "College project",
      featureIds: ["auth-google", "pay-razorpay"],
    };
    const est = computeEstimate(draft, PRICING, PLATFORMS, REAL_FEATURES);
    const expectedFeatureTotal = ACADEMIC_EXTRA_FEATURE_PRICES["auth-google"] + ACADEMIC_EXTRA_FEATURE_PRICES["pay-razorpay"];
    expect(est.featureTotal).toBe(expectedFeatureTotal);
    expect(est.estimatedTotal).toBe(9999 + expectedFeatureTotal);
    // the actual amount charged is still the flat per-type token, never the feature total
    expect(est.tokenAmount).toBe(1500);
  });

  it("leaves a free (Included) feature price at 0 even for Academic", () => {
    const included = REAL_FEATURES.find((f) => f.id === "auth-email-password")!;
    expect(priceForFeature(included, "academic", false)).toBe(0);
  });

  it("does not override a feature the AI understanding call recommends as necessary (Included, not Extra)", () => {
    const razorpay = REAL_FEATURES.find((f) => f.id === "pay-razorpay")!;
    // isRecommended = true → treated as an Included feature, catalog price kept
    expect(priceForFeature(razorpay, "academic", true)).toBe(2000);
  });

  it("falls back to the catalog price for an Academic feature not yet in the override map", () => {
    const future = REAL_FEATURES.find((f) => f.id === "not-in-override-map")!;
    expect(priceForFeature(future, "academic", false)).toBe(999);
  });
});

/**
 * Extracts the `{ "id": number, ... }` entries out of a named object literal
 * in raw TypeScript source, without importing/executing the file — used
 * below to compare the Edge Function's Deno-only pricing mirror against this
 * repo's real, imported `ACADEMIC_EXTRA_FEATURE_PRICES` without needing a
 * Deno runtime in this Node/vitest suite.
 */
function extractPriceMapLiteral(source: string, constName: string): Record<string, number> {
  const declIndex = source.indexOf(constName);
  if (declIndex === -1) throw new Error(`${constName} not found in source`);
  const braceStart = source.indexOf("{", declIndex);
  const braceEnd = source.indexOf("};", braceStart);
  if (braceStart === -1 || braceEnd === -1) throw new Error(`${constName} object literal not found`);
  const body = source.slice(braceStart, braceEnd);
  const map: Record<string, number> = {};
  const entryPattern = /["']([\w-]+)["']\s*:\s*(\d+(?:\.\d+)?)/g;
  let match: RegExpExecArray | null;
  while ((match = entryPattern.exec(body))) {
    map[match[1]] = Number(match[2]);
  }
  return map;
}

describe("Academic Extra Feature pricing — website ↔ Edge Function parity", () => {
  it("the create-custom-project-order Edge Function's pricing mirror matches this file's map exactly", () => {
    // mobile-app/supabase/functions/_shared/academicPricing.ts is a Deno file
    // (create-custom-project-order's post-payment snapshot pricing source) —
    // it can't be imported into this Node/vitest suite, so this reads it as
    // plain text and diffs its map against the real, imported constant. If
    // this test ever fails, someone edited one map without the other —
    // update both files together (see the comment on either one).
    const edgeFnPath = path.resolve(
      __dirname,
      "../../../mobile-app/supabase/functions/_shared/academicPricing.ts",
    );
    const source = fs.readFileSync(edgeFnPath, "utf8");
    const edgeMap = extractPriceMapLiteral(source, "ACADEMIC_EXTRA_FEATURE_PRICES");
    expect(edgeMap).toEqual(ACADEMIC_EXTRA_FEATURE_PRICES);
  });
});
