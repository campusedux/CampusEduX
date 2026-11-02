import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computeEstimate, emptyDraft } from "@/lib/customProjects";
import { CustomProjectReadError } from "@/lib/customProjectReads";

const api = vi.hoisted(() => ({ draft: vi.fn(), retry: vi.fn(), refresh: vi.fn() }));
vi.mock("react", async original => ({ ...await original<typeof import("react")>(), useTransition: () => [false, (callback: () => void) => callback()] }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: api.refresh }) }));
vi.mock("@/app/custom-projects/_builder/useDraft", () => ({ useDraft: api.draft }));

import BuilderStart from "@/app/custom-projects/start/BuilderStart";
import BuilderFeatures from "@/app/custom-projects/features/BuilderFeatures";
import { EditableEstimateSummary } from "@/app/custom-projects/_builder/EditableEstimateSummary";
import { LoadError } from "@/app/custom-projects/_builder/LoadError";

const draft = { ...emptyDraft(), title: "Fixture", projectType: "personal" as const, projectLevel: "standard" as const, platform: "web" as const };
const props = { pricing: [{ project_type: "personal", project_level: "standard", base_price: 4000, token_amount: 500, pricing_version: 1 }], platforms: [{ platform: "web", label: "Web", charge: 100, sort_order: 1 }], features: [], catalogAvailable: true };

beforeEach(() => {
  api.retry.mockReset(); api.refresh.mockReset();
  api.draft.mockReset().mockReturnValue({ draft, loaded: false, userId: "fixture-owner", loadError: new CustomProjectReadError("transient"), retryLoad: api.retry });
});

describe("builder read-error UI", () => {
  it.each(["start", "features", "estimate"])("renders recovery before empty content or amounts in %s", screen => {
    const element = screen === "start" ? createElement(BuilderStart, props) : screen === "features" ? createElement(BuilderFeatures, props) : createElement(EditableEstimateSummary, { ...props, initialDraft: draft, initialEstimate: computeEstimate(draft, props.pricing, props.platforms, []) });
    const html = renderToStaticMarkup(element);
    expect(html).toContain('role="alert"');
    expect(html).toContain("Retry");
    for (const text of ["₹", "No extras", "Choose a project type", "Loading your draft", "Continue to payment"]) expect(html).not.toContain(text);
  });
  it("retains the valid empty feature state after a successful read", () => {
    api.draft.mockReturnValue({ draft, loaded: true, userId: "fixture-owner", loadError: null });
    const html = renderToStaticMarkup(createElement(BuilderFeatures, props));
    expect(html).not.toContain('role="alert"');
    expect(html).toContain("No extras added");
    expect(html).toContain("No included features are configured");
  });
  it("retries browser drafts in place and server reads through router.refresh", () => {
    const local = LoadError({ kind: "transient", onRetry: api.retry });
    const localError = local.props.children[0] as ReactElement<{ onRetry: () => void }>;
    localError.props.onRetry();
    expect(api.retry).toHaveBeenCalledOnce();
    expect(api.refresh).not.toHaveBeenCalled();
    const server = LoadError({ kind: "transient" });
    (server.props.children[0] as ReactElement<{ onRetry: () => void }>).props.onRetry();
    expect(api.refresh).toHaveBeenCalledOnce();
  });
});
