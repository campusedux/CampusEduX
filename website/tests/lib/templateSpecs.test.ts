import { describe, it, expect } from "vitest";
import {
  TEMPLATE_IDS,
  TEMPLATE_SPECS,
  templateSpec,
  resolveTemplate,
  DEFAULT_RESOLVED_TEMPLATES,
} from "@/lib/resumeBuilder/templateSpecs";

describe("templateSpec", () => {
  it("resolves every built-in id to its own spec", () => {
    for (const id of TEMPLATE_IDS) {
      expect(templateSpec(id).id).toBe(id);
    }
  });

  it("falls back to modern for an unknown / admin-added / empty id", () => {
    expect(templateSpec("executive-2024").id).toBe("modern");
    expect(templateSpec("").id).toBe("modern");
    expect(templateSpec(null).id).toBe("modern");
    expect(templateSpec(undefined).id).toBe("modern");
  });

  it("gives the four templates genuinely different design decisions", () => {
    const headers = TEMPLATE_IDS.map((id) => TEMPLATE_SPECS[id].header);
    const headings = TEMPLATE_IDS.map((id) => TEMPLATE_SPECS[id].heading);
    expect(new Set(headers).size).toBe(4);
    expect(new Set(headings).size).toBe(4);
  });

  it("minimal uses no accent colour", () => {
    expect(TEMPLATE_SPECS.minimal.accent).toBe("none");
  });
});

describe("resolveTemplate", () => {
  it("prefers the admin row's name / accent / premium over spec defaults", () => {
    const resolved = resolveTemplate({ id: "modern", name: "Modern Pro", accent_color: "#123456", is_premium: true });
    expect(resolved.label).toBe("Modern Pro");
    expect(resolved.accentColor).toBe("#123456");
    expect(resolved.isPremium).toBe(true);
    expect(resolved.atsFriendly).toBe(true); // still from the spec
  });

  it("falls back to spec label / blurb / a per-id default accent when the row is sparse", () => {
    const resolved = resolveTemplate({ id: "creative" });
    expect(resolved.label).toBe("Creative");
    expect(resolved.description).toBe(TEMPLATE_SPECS.creative.blurb);
    expect(resolved.accentColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("exposes all four built-ins as defaults", () => {
    expect(DEFAULT_RESOLVED_TEMPLATES.map((t) => t.id)).toEqual(["modern", "professional", "minimal", "creative"]);
  });
});
