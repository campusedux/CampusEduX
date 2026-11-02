import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { emptyDraft } from "@/lib/customProjects";
import { CustomProjectReadError, readCustomProject } from "@/lib/customProjectReads";

const api = vi.hoisted(() => ({ results: {} as Record<string, unknown>, from: vi.fn(), eq: vi.fn(), available: true, user: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ getPublicSupabase: () => api.available ? { from: api.from } : null }));
vi.mock("@/lib/supabase/authed-server", () => ({ createAuthedServerSupabase: () => ({ from: api.from }) }));
vi.mock("@/lib/auth", () => ({ requireUser: api.user }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/custom-projects/start/BuilderStart", () => ({ default: () => createElement("div", null, "Start form") }));
vi.mock("@/app/custom-projects/features/BuilderFeatures", () => ({ default: () => createElement("div", null, "Features form") }));
vi.mock("@/app/custom-projects/_builder/EditableEstimateSummary", () => ({ EditableEstimateSummary: () => createElement("a", { href: "/custom-projects/checkout" }, "Continue to payment") }));
vi.mock("@/app/custom-projects/checkout/CustomProjectCheckout", () => ({ default: () => createElement("button", null, "Pay token") }));

import { loadCatalog, loadDraftServer, loadDraftWithEstimate } from "@/lib/customProjects.server";
import Start from "@/app/custom-projects/start/page";
import Features from "@/app/custom-projects/features/page";
import Estimate from "@/app/custom-projects/estimate/page";
import Checkout from "@/app/custom-projects/checkout/page";

const draft = { ...emptyDraft(), title: "Fixture project", objective: "A fabricated example", projectType: "personal", projectLevel: "standard", platform: "web" };
const tables = ["custom_project_pricing", "custom_project_platform_pricing", "custom_project_features"];
const fail = { data: null, error: { code: "08006", message: "private-provider-detail" }, status: 503 };

beforeEach(() => {
  api.available = true;
  api.user.mockReset().mockResolvedValue({ id: "fixture-owner" });
  api.eq.mockReset();
  api.results = {
    custom_project_pricing: { data: [{ project_type: "personal", project_level: "standard", base_price: 4000, token_amount: 500, pricing_version: 1 }], error: null },
    custom_project_platform_pricing: { data: [{ platform: "web", label: "Web", charge: 100, sort_order: 1 }], error: null },
    custom_project_features: { data: [{ id: "fixture-feature", name: "Feature", project_types: ["personal"], project_levels: ["standard"], price: 0 }], error: null },
    custom_project_drafts: { data: { payload: draft, updated_at: "2026-01-01T00:00:00Z" }, error: null },
  };
  api.from.mockReset().mockImplementation((table: string) => {
    const query = {
      select: () => query, eq: (...args: unknown[]) => { api.eq(...args); return query; }, order: () => query,
      maybeSingle: () => query, abortSignal: () => query,
      then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => {
        const response = api.results[table];
        return (response instanceof Error ? Promise.reject(response) : Promise.resolve(response)).then(resolve, reject);
      },
    };
    return query;
  });
});
afterEach(() => vi.useRealTimers());

describe("Custom Project loader read contracts", () => {
  it("loads a catalog and normalizes optional feature arrays", async () => {
    const result = await loadCatalog();
    expect(result.catalogAvailable).toBe(true);
    expect(result.pricing).toHaveLength(1);
    expect(result.features[0]).toMatchObject({ dependencies: [], conflicts: [], included_in_levels: [] });
    expect(api.from).toHaveBeenCalledTimes(3);
  });
  it("preserves genuinely empty successful catalog results", async () => {
    for (const table of tables) api.results[table] = { data: [], error: null };
    expect(await loadCatalog()).toEqual({ pricing: [], platforms: [], features: [], catalogAvailable: true });
  });
  it.each(tables)("rejects a failed %s read instead of returning partial or empty data", async table => {
    api.results[table] = fail;
    await expect(loadCatalog()).rejects.toMatchObject({ kind: "transient" });
  });
  it("classifies an unavailable client, schema or missing response separately", async () => {
    api.available = false;
    await expect(loadCatalog()).rejects.toMatchObject({ kind: "unavailable" });
    api.available = true;
    api.results[tables[0]] = { data: null, error: { code: "42P01" } };
    await expect(loadCatalog()).rejects.toMatchObject({ kind: "unavailable" });
    api.results[tables[0]] = { data: null, error: null };
    await expect(loadCatalog()).rejects.toMatchObject({ kind: "unavailable" });
  });
  it("handles a rejected network request without leaking provider details", async () => {
    api.results[tables[0]] = new TypeError("private-provider-detail");
    await expect(loadCatalog()).rejects.toMatchObject({ kind: "transient" });
    await expect(loadCatalog()).rejects.not.toThrow("private-provider-detail");
  });
  it("bounds a stalled request and aborts it after ten seconds", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const pending = expect(readCustomProject((value) => {
      signal = value;
      return new Promise(() => {});
    })).rejects.toMatchObject({ kind: "transient" });
    await vi.advanceTimersByTimeAsync(10_000);
    await pending;
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("returns the saved draft, persisted timestamp and current catalog estimate", async () => {
    const result = await loadDraftWithEstimate("fixture-owner");
    expect(result.draft.title).toBe(draft.title);
    expect(result.draftUpdatedAt).toBe("2026-01-01T00:00:00Z");
    expect(result.estimate).toMatchObject({ ready: true, estimatedTotal: 4100, tokenAmount: 500 });
    expect(api.eq).toHaveBeenCalledWith("user_id", "fixture-owner");
    expect(api.from).toHaveBeenCalledTimes(4);
  });
  it("keeps a genuine missing draft empty without inventing a saved timestamp", async () => {
    api.results.custom_project_drafts = { data: null, error: null };
    expect(await loadDraftServer("fixture-owner")).toEqual(emptyDraft());
    expect(await loadDraftWithEstimate("fixture-owner")).toMatchObject({ draftUpdatedAt: null, estimate: { ready: false } });
  });
  it.each(["42501", "PGRST301", "PGRST302", "PGRST303"])("preserves explicit draft authorization failure %s", async code => {
    api.results.custom_project_drafts = { data: null, error: { code } };
    await expect(loadDraftServer("fixture-owner")).rejects.toMatchObject({ kind: "unauthorized" });
  });
  it("does not turn draft database failures into an empty draft or quote", async () => {
    api.results.custom_project_drafts = fail;
    await expect(loadDraftServer("fixture-owner")).rejects.toBeInstanceOf(CustomProjectReadError);
    await expect(loadDraftWithEstimate("fixture-owner")).rejects.toMatchObject({ kind: "transient" });
  });
  it("rejects a missing draft response while keeping null as genuine not-found", async () => {
    api.results.custom_project_drafts = { data: undefined, error: null };
    await expect(loadDraftServer("fixture-owner")).rejects.toMatchObject({ kind: "unavailable" });
  });
  it.each([401, 403])("keeps HTTP %s authorization failures explicit", async status => {
    api.results.custom_project_drafts = { data: null, error: { message: "Denied" }, status };
    await expect(loadDraftServer("fixture-owner")).rejects.toMatchObject({ kind: "unauthorized" });
  });
  it.each(tables.slice(0, 2))("does not fabricate a quote when selected rows in %s are unavailable", async table => {
    api.results[table] = { data: [], error: null };
    await expect(loadDraftWithEstimate("fixture-owner")).rejects.toMatchObject({ kind: "unavailable" });
  });
});

describe("Custom Project pages", () => {
  it.each([Start, Features, Estimate, Checkout])("renders retry UI without false empty content or prices on failed catalog reads (%#)", async Page => {
    api.results[tables[2]] = fail;
    const html = renderToStaticMarkup(await Page());
    expect(html).toContain('role="alert"');
    expect(html).toContain("Retry");
    for (const text of ["Still need:", "isn&#x27;t complete", "No extra features", "Pay token", "₹", "private-provider-detail", "Start form", "Features form"]) expect(html).not.toContain(text);
  });
  it.each([Estimate, Checkout])("shows retry UI for failed draft reads (%#)", async Page => {
    api.results.custom_project_drafts = fail;
    const html = renderToStaticMarkup(await Page());
    expect(html).toContain('role="alert"');
    expect(html).not.toContain("₹");
  });
  it("shows sign-in recovery for explicit authorization denial", async () => {
    api.results.custom_project_drafts = { data: null, error: { code: "42501" } };
    const html = renderToStaticMarkup(await Checkout());
    expect(html).toContain('href="/login"');
    expect(html).not.toContain(">Retry<");
  });
  it("preserves the authentication gate and its navigation signal", async () => {
    api.user.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(Start()).rejects.toThrow("NEXT_REDIRECT");
    expect(api.from).not.toHaveBeenCalled();
  });
  it("recovers on retry and loads the estimate catalog only once", async () => {
    const good = api.results[tables[0]];
    api.results[tables[0]] = fail;
    expect(renderToStaticMarkup(await Estimate())).toContain("Retry");
    api.results[tables[0]] = good;
    api.from.mockClear();
    const html = renderToStaticMarkup(await Estimate());
    expect(html).toContain('href="/custom-projects/checkout"');
    expect(html).not.toContain('role="alert"');
    expect(api.from).toHaveBeenCalledTimes(4);
  });
  it("preserves missing-draft navigation and successful checkout values", async () => {
    const good = api.results.custom_project_drafts;
    api.results.custom_project_drafts = { data: null, error: null };
    expect(renderToStaticMarkup(await Estimate())).toContain("Still need:");
    expect(renderToStaticMarkup(await Checkout())).toContain('href="/custom-projects/start"');
    api.results.custom_project_drafts = good;
    const html = renderToStaticMarkup(await Checkout());
    for (const text of ["4,100", "500", "Pay token", 'href="/custom-projects/features"', 'href="/custom-projects/estimate"']) expect(html).toContain(text);
  });
});
