import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SelectionSummary } from "@/app/custom-projects/_builder/SelectionSummary";
import { emptyDraft, type Estimate } from "@/lib/customProjects";

const estimate: Estimate = {
  basePrice: 4000, platformCharge: 100, featureTotal: 400, estimatedTotal: 4500, tokenAmount: 500, ready: true,
  selectedFeatures: [
    { id: "included", name: "Sign in", price: 0, category: "Auth", isIncluded: true },
    { id: "extra", name: "Reports", price: 400, category: "Analytics", isIncluded: false },
  ],
};

describe("custom project selection summary", () => {
  it("shows the existing estimate breakdown, selected items and accessible removal controls", () => {
    const draft = { ...emptyDraft(), title: "My project", projectType: "personal" as const, projectLevel: "standard" as const, platform: "web" as const, referenceFiles: [{ path: "file", name: "notes.pdf", sizeMb: 1 }] };
    const html = renderToStaticMarkup(createElement(SelectionSummary, { draft, estimate, onRemoveFeature: vi.fn(), onRemoveFile: vi.fn() }));
    for (const text of ["My project", "Sign in", "Reports", "notes.pdf", "4,500", "500", "400"]) expect(html).toContain(text);
    expect(html).toContain('aria-label="Remove Reports"');
    expect(html).toContain('aria-label="Remove notes.pdf"');
  });
  it("shows missing and empty states and keeps review read-only", () => {
    const empty = { ...estimate, basePrice: 0, estimatedTotal: 0, tokenAmount: 0, selectedFeatures: [], ready: false };
    const html = renderToStaticMarkup(createElement(SelectionSummary, { draft: emptyDraft(), estimate: empty, review: true }));
    expect(html).toContain("Not set");
    expect(html).toContain("No extras added");
    expect(html).toContain("No files uploaded");
    expect(html).not.toContain('aria-label="Remove ');
  });
});
