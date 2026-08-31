import { describe, it, expect } from "vitest";
import {
  computeEstimate,
  emptyDraft,
  normalizeDraft,
  featuresForTier,
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
  { id: "f-free", name: "Login", description: "", category: "Auth", project_types: ["academic", "business"], project_levels: ["standard", "advanced"], price: 0, sort_order: 10 },
  { id: "f-paid", name: "Google login", description: "", category: "Auth", project_types: ["academic", "business"], project_levels: ["standard", "advanced"], price: 800, sort_order: 20 },
  { id: "f-biz-only", name: "AI analytics", description: "", category: "AI", project_types: ["business"], project_levels: ["standard", "advanced"], price: 4500, sort_order: 30 },
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
});
