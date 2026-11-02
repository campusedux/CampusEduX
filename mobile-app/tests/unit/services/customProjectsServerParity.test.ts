// The server (create-custom-project-order -> _shared/customProjectPricing.ts)
// and the client (calculateEstimate) must agree to the rupee, and included
// features must never be charged by either.
jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { calculateEstimate } from "@/services/customProjects.service";
import { catalogTokenAmount, priceFeatures, type FeatureRow } from "../../../supabase/functions/_shared/customProjectPricing";
import {
  CUSTOM_PROJECT_LEVELS,
  CUSTOM_PROJECT_TYPES,
  type CustomFeature,
  type CustomPlatformPricing,
  type CustomProjectPricing,
} from "@/types";

const ALL_TIERS = CUSTOM_PROJECT_TYPES.flatMap((t) => CUSTOM_PROJECT_LEVELS.map((l) => `${t}:${l}`));
const BOTH = ["standard", "advanced"];
const ANY = ["academic", "personal", "business"];

// Mirrors the seeded catalog shapes (0033 + 0116) for the ids that matter.
const ROWS: FeatureRow[] = [
  { id: "auth-email-password", name: "Login", price: 0, category: "Authentication", project_types: ANY, project_levels: BOTH, included_in_levels: ALL_TIERS },
  { id: "search-filters", name: "Filters", price: 800, category: "Search", project_types: ANY, project_levels: BOTH, included_in_levels: ALL_TIERS.filter((k) => k !== "academic:standard") },
  { id: "auth-google", name: "Google login", price: 800, category: "Authentication", project_types: ANY, project_levels: BOTH, included_in_levels: [] },
  { id: "rt-live-chat", name: "Live chat", price: 3000, category: "Real-Time", project_types: ["personal", "business"], project_levels: BOTH, included_in_levels: [] },
  { id: "ai-chatbot", name: "AI chatbot", price: 4000, category: "AI", project_types: ["personal", "business"], project_levels: ["advanced"], included_in_levels: [] },
];

const toClient = (r: FeatureRow, sortOrder: number): CustomFeature => ({
  id: r.id, name: r.name, description: "", category: r.category, price: r.price, sortOrder,
  projectTypes: r.project_types as CustomFeature["projectTypes"],
  projectLevels: r.project_levels as CustomFeature["projectLevels"],
  includedInLevels: r.included_in_levels,
});

const BASE: Record<string, number> = {
  "academic:standard": 7999, "academic:advanced": 9999,
  "personal:standard": 15999, "personal:advanced": 19999,
  "business:standard": 29999, "business:advanced": 39999,
};
const PRICING: CustomProjectPricing[] = ALL_TIERS.map((k) => {
  const [projectType, projectLevel] = k.split(":") as [CustomProjectPricing["projectType"], CustomProjectPricing["projectLevel"]];
  return { projectType, projectLevel, basePrice: BASE[k], tokenAmount: 0, pricingVersion: 1 };
});
const PLATFORMS: CustomPlatformPricing[] = [{ platform: "web_android", label: "Web + Android", charge: 3000, sortOrder: 1 }];

// Every id a client might send, including included ones (old app / website builder).
const SELECTIONS = [[], ["auth-google"], ["search-filters", "auth-google"], ["auth-email-password", "rt-live-chat", "ai-chatbot", "search-filters"]];

describe("server ⇄ client pricing parity", () => {
  it('uses an edited catalog token on the server and client', () => {
    const pricing = PRICING.map((row) => ({ ...row, tokenAmount: 2123.45 }));
    for (const projectLevel of CUSTOM_PROJECT_LEVELS) {
      const estimate = calculateEstimate({ projectType: 'personal', projectLevel, platform: 'web_android', featureIds: [] }, pricing, PLATFORMS, []);
      expect(catalogTokenAmount('2123.45')).toBe(estimate.token);
      expect(estimate.token).toBe(2123.45);
    }
  });

  it.each([null, undefined, '', 'bad', 'NaN', 0, -1, Infinity, true])('rejects an unchargeable catalog token: %s', (value) => {
    expect(catalogTokenAmount(value)).toBeNull();
  });

  it.each(ALL_TIERS.filter((tier) => !tier.startsWith("academic:")))("%s: estimated_total and included set match for every selection", (tier) => {
    const [projectType, projectLevel] = tier.split(":") as [CustomProjectPricing["projectType"], CustomProjectPricing["projectLevel"]];
    for (const featureIds of SELECTIONS) {
      const client = calculateEstimate(
        { projectType, projectLevel, platform: "web_android", featureIds },
        PRICING, PLATFORMS, ROWS.map(toClient)
      );
      const server = priceFeatures(ROWS, featureIds, projectType, projectLevel, []);
      const serverTotal = Math.round((BASE[tier] + server.featureTotal + 3000) * 100) / 100;

      expect(serverTotal).toBe(client.total);
      expect(server.featureTotal).toBe(client.addOnsTotal);
      expect(server.features.filter((f) => f.isIncluded).map((f) => f.id).sort())
        .toEqual(client.includedFeatures.map((f) => f.id).sort());
      expect(server.features.filter((f) => !f.isIncluded).map((f) => f.id).sort())
        .toEqual(client.addOns.map((f) => f.id).sort());
    }
  });

  it("new academic mentoring ignores implementation selections and platform charges", () => {
    const result = calculateEstimate({ projectType: "academic", projectLevel: "standard", platform: "web_android", featureIds: ["doc-academic-package", "auth-google"] }, PRICING, PLATFORMS, ROWS.map(toClient));
    expect(result.addOns).toEqual([]);
    expect(result.includedFeatures).toEqual([]);
    expect(result.platformCharges).toBe(0);
    expect(result.total).toBe(BASE["academic:standard"]);
  });

  it("the server never charges an included feature, even when a client sends its id", () => {
    const out = priceFeatures(ROWS, ["auth-email-password", "search-filters"], "personal", "standard", []);
    expect(out.featureTotal).toBe(0);
    expect(out.features.every((f) => f.isIncluded && f.price === 0)).toBe(true);
  });

  it("the server snapshots included features at price 0 alongside paid add-ons", () => {
    const out = priceFeatures(ROWS, ["rt-live-chat"], "personal", "standard", []);
    expect(out.features.map((f) => [f.id, f.price, f.isIncluded])).toEqual([
      ["auth-email-password", 0, true],
      ["search-filters", 0, true],
      ["rt-live-chat", 3000, false],
    ]);
  });

  it("keeps the Academic override for paid add-ons", () => {
    const out = priceFeatures(ROWS, ["search-filters"], "academic", "standard", []);
    expect(out.features.find((f) => f.id === "search-filters")).toMatchObject({ price: 55, isIncluded: false });
  });

  it("drops features that are not offered for the tier", () => {
    const out = priceFeatures(ROWS, ["ai-chatbot"], "personal", "standard", []);
    expect(out.features.some((f) => f.id === "ai-chatbot")).toBe(false);
  });
});
