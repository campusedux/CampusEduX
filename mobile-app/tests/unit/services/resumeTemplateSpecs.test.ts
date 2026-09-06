import { TEMPLATE_IDS, TEMPLATE_SPECS, templateSpec, resolveTemplate, DEFAULT_RESOLVED_TEMPLATES } from "@/services/resumeTemplateSpecs";

describe("templateSpec (mobile)", () => {
  it("resolves every built-in id and falls back to modern for anything else", () => {
    for (const id of TEMPLATE_IDS) expect(templateSpec(id).id).toBe(id);
    expect(templateSpec("executive").id).toBe("modern");
    expect(templateSpec(null).id).toBe("modern");
  });

  it("the four templates have genuinely different header + heading treatments", () => {
    expect(new Set(TEMPLATE_IDS.map((id) => TEMPLATE_SPECS[id].header)).size).toBe(4);
    expect(new Set(TEMPLATE_IDS.map((id) => TEMPLATE_SPECS[id].heading)).size).toBe(4);
    expect(TEMPLATE_SPECS.minimal.accent).toBe("none");
  });
});

describe("resolveTemplate (mobile)", () => {
  it("prefers the catalog row, falls back to spec defaults", () => {
    const r = resolveTemplate({ id: "modern", name: "Modern X", accent_color: "#123456", is_premium: true });
    expect(r.label).toBe("Modern X");
    expect(r.accentColor).toBe("#123456");
    expect(r.isPremium).toBe(true);
    expect(resolveTemplate({ id: "creative" }).accentColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("accepts either snake_case or camelCase accent from the catalog", () => {
    expect(resolveTemplate({ id: "modern", accentColor: "#abcabc" }).accentColor).toBe("#abcabc");
  });

  it("DEFAULT_RESOLVED_TEMPLATES covers all four", () => {
    expect(DEFAULT_RESOLVED_TEMPLATES.map((t) => t.id)).toEqual(["modern", "professional", "minimal", "creative"]);
  });
});
