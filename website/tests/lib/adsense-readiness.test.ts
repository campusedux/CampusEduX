import { afterEach, describe, expect, it, vi } from "vitest";
import { FALLBACK_FAQS } from "@/lib/faq";
import { referralRewardText } from "@/lib/referral";
import { projectTokenPrices } from "@/lib/projectPricingText";
import { readCookieConsent, saveCookieConsent, consentModeSignals } from "@/lib/cookieConsent";
import { interpolateDocument } from "@/legal/interpolate";
import { getLegalDocument } from "@/legal/registry";
import { publicReadDeadline } from "@/lib/publicReadDeadline";
import { onlyActiveJobs } from "@/lib/jobsActive";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("verified public information", () => {
  it("offers useful FAQs without exposing internal publishing details", () => {
    expect(FALLBACK_FAQS.length).toBeGreaterThanOrEqual(7);
    expect(FALLBACK_FAQS.length).toBeLessThanOrEqual(10);
    expect(JSON.stringify(FALLBACK_FAQS)).not.toMatch(/CMS|admin panel|Lorem|TODO/);
  });
  it("puts qualification and configured validity beside every reward", () => {
    const text = referralRewardText({ bonus_type: "flat", bonus_value: 100, bonus_validity_days: 15, reward_on_signup: true });
    expect(text).toMatch(/first successful purchase/);
    expect(text).toMatch(/valid for 15 days/);
    expect(text).not.toMatch(/as soon as.*sign/);
    expect(referralRewardText(null)).not.toMatch(/Earn/);
    expect(referralRewardText({ bonus_value: 100, bonus_validity_days: 15, reward_on_first_purchase: false })).toMatch(/unavailable/);
  });
  it("renders the same catalogue amount in both legal documents, including level differences", () => {
    const prices = projectTokenPrices([
      { project_type: "academic", project_level: "standard", token_amount: 500, base_price: 1500, pricing_version: 1 },
      { project_type: "academic", project_level: "advanced", token_amount: 750, base_price: 2000, pricing_version: 1 },
    ]);
    expect(prices).toContain("standard");
    expect(prices).toContain("advanced");
    for (const id of ["terms", "refund-policy"] as const) {
      const doc = interpolateDocument(getLegalDocument(id), { customProjectTokenPrices: prices });
      expect(JSON.stringify(doc)).toContain(prices);
      expect(JSON.stringify(doc)).not.toContain("Mentoring ₹1,500");
    }
    expect(projectTokenPrices([])).not.toMatch(/₹/);
  });
  it("adds website advertising disclosures while preserving app SDK disclosures", () => {
    const text = JSON.stringify(getLegalDocument("privacy-policy"));
    expect(text).toContain("when we display advertising");
    expect(text).toContain("does not use a third-party analytics or advertising SDK");
    expect(text).toContain("https://policies.google.com/technologies/partner-sites");
    expect(text).toContain("https://adssettings.google.com/");
  });
});

describe("consent persistence and withdrawal", () => {
  it("defaults to denied and stores advertising independently of analytics", () => {
    let cookie = "";
    vi.stubGlobal("document", { get cookie() { return cookie; }, set cookie(value: string) { cookie = value.split(";")[0]; } });
    vi.stubGlobal("CustomEvent", class extends Event { constructor(name: string) { super(name); } });
    vi.stubGlobal("window", { location: { protocol: "https:" }, dispatchEvent: vi.fn() });
    expect(readCookieConsent()).toBeNull();
    saveCookieConsent({ analytics: false, ads: true });
    expect(readCookieConsent()).toEqual({ analytics: false, ads: true });
    saveCookieConsent({ analytics: true, ads: false });
    expect(readCookieConsent()).toEqual({ analytics: true, ads: false });
    expect(consentModeSignals(readCookieConsent()!).ad_storage).toBe("denied");
    saveCookieConsent({ analytics: false, ads: false });
    expect(readCookieConsent()).toEqual({ analytics: false, ads: false });
  });
});

describe("freshness and bounded reads", () => {
  it("uses the identical status/deadline condition for embedded company counts", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-02T00:00:00Z"));
    const or = vi.fn(() => ({})); const eq = vi.fn(() => ({ or }));
    onlyActiveJobs({ eq }, "jobs");
    expect(eq).toHaveBeenCalledWith("jobs.status", "open");
    expect(or).toHaveBeenCalledWith("application_deadline.is.null,application_deadline.gte.2026-11-02T00:00:00.000Z", { referencedTable: "jobs" });
  });
  it("fails stalled reads instead of hanging or presenting a missing lesson", async () => {
    vi.useFakeTimers();
    const slow = publicReadDeadline(() => new Promise<never>(() => {}), 100);
    const assertion = expect(slow).rejects.toThrow("temporarily unavailable");
    await vi.advanceTimersByTimeAsync(100);
    await assertion;
    expect(await publicReadDeadline(async () => null)).toBeNull();
  });
});
