import {
  normalizeResumeContent,
  contentToLegacyColumns,
  defaultStarterContent,
  buildResumeRenderBlocks,
  applyLegacyTextSection,
  applyLegacyEducation,
  applyLegacySkills,
  moveBlock,
  duplicateBlock,
  deleteBlock,
  toggleBlockHidden,
  completionItems,
  computeCompletion,
  makeSectionBlock,
} from "@/services/resumeContent";

const legacy = {
  sections: { summary: "Pitch here.", experience: "Did things", projects: "", references: "" },
  education: [{ id: "e1", degree: "B.Tech", institution: "IIT", startYear: "2019", endYear: "2023", percentage: "8.6" }],
  skills: { technical: ["React", "Node"], soft: ["Comms"] },
  layout: { order: ["experience", "summary", "education", "skills"], hidden: ["summary"] },
};

describe("normalizeResumeContent — legacy upgrade", () => {
  it("builds blocks in layout order, respecting hidden, skipping empty sections", () => {
    const content = normalizeResumeContent([], legacy);
    expect(content.map((b) => b.type)).toEqual(["experience", "summary", "education", "skills"]);
    expect(content.find((b) => b.type === "summary")?.hidden).toBe(true);
    expect(content.map((b) => b.type)).not.toContain("projects");
  });

  it("maps a legacy education row into a structured entry", () => {
    const edu = normalizeResumeContent(undefined, legacy).find((b) => b.type === "education");
    expect(edu?.variant).toBe("entries");
    expect(edu?.entries?.[0]).toMatchObject({ title: "B.Tech", subtitle: "IIT", startDate: "2019", description: "Score: 8.6" });
  });

  it("falls back to the starter set when there is nothing to upgrade", () => {
    expect(normalizeResumeContent(null, {}).map((b) => b.type)).toEqual(defaultStarterContent().map((b) => b.type));
  });

  it("sanitises a stored array: unknown type -> custom, dedupes ids", () => {
    const content = normalizeResumeContent([
      { id: "a", type: "summary", heading: "S", variant: "text", text: "hi" },
      { id: "a", type: "made_up", variant: "text" },
    ]);
    expect(content).toHaveLength(2);
    expect(content[1].type).toBe("custom");
    expect(new Set(content.map((b) => b.id)).size).toBe(2);
  });
});

describe("contentToLegacyColumns round-trip", () => {
  it("projects blocks back onto the legacy columns", () => {
    const legacyOut = contentToLegacyColumns(normalizeResumeContent(undefined, legacy));
    expect(legacyOut.sections.summary).toBe("Pitch here.");
    expect(legacyOut.education[0]).toMatchObject({ degree: "B.Tech", percentage: "8.6" });
    expect(legacyOut.skills).toEqual({ technical: ["React", "Node"], soft: ["Comms"] });
    expect(legacyOut.layout.hidden).toContain("summary");
  });
});

describe("surgical legacy patchers preserve web-added sections", () => {
  it("applyLegacyTextSection updates one block and leaves an Awards block intact", () => {
    const content = [
      { id: "sum", type: "summary" as const, heading: "Summary", variant: "text" as const, hidden: false, text: "old" },
      { id: "awd", type: "awards" as const, heading: "Awards", variant: "entries" as const, hidden: false, entries: [] },
    ];
    const next = applyLegacyTextSection(content, "summary", "new pitch");
    expect(next.find((b) => b.type === "summary")?.text).toBe("new pitch");
    expect(next.find((b) => b.type === "awards")).toBeTruthy();
  });

  it("applyLegacyEducation / applyLegacySkills replace their own block only", () => {
    const start = defaultStarterContent();
    const withEdu = applyLegacyEducation(start, [{ degree: "M.Tech", institution: "IISc", startYear: "2023", endYear: "2025", percentage: "" }]);
    expect(withEdu.find((b) => b.type === "education")?.entries?.[0].title).toBe("M.Tech");
    const withSkills = applyLegacySkills(withEdu, { technical: ["Go"], soft: [] });
    expect(withSkills.find((b) => b.type === "skills")?.groups?.[0].items).toEqual(["Go"]);
    expect(withSkills.length).toBe(start.length);
  });
});

describe("buildResumeRenderBlocks", () => {
  it("emits structured entries + a flat lines fallback and skips empties", () => {
    const blocks = buildResumeRenderBlocks([
      { id: "e", type: "experience", heading: "Experience", variant: "entries", hidden: false, entries: [
        { id: "x", title: "Engineer", subtitle: "Acme", location: "Pune", startDate: "2023", endDate: "Present", description: "Built it\n- Faster by 40%", url: "", tags: ["Go"] },
      ] },
      { id: "s", type: "summary", heading: "Summary", variant: "text", hidden: false, text: "  " },
    ]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].entries?.[0]).toMatchObject({ title: "Engineer", meta: "Pune · 2023 – Present" });
    expect(blocks[0].lines).toContain("• Faster by 40%");
  });
});

describe("mobile block helpers", () => {
  const base = [makeSectionBlock("summary"), makeSectionBlock("experience"), makeSectionBlock("education")];

  it("moveBlock / duplicateBlock / deleteBlock / toggleBlockHidden", () => {
    expect(moveBlock(base, base[0].id, "down").map((b) => b.type)).toEqual(["experience", "summary", "education"]);
    const dup = duplicateBlock(base, base[1].id);
    expect(dup).toHaveLength(4);
    expect(dup[2].id).not.toBe(base[1].id);
    expect(deleteBlock(base, base[1].id).map((b) => b.type)).toEqual(["summary", "education"]);
    expect(toggleBlockHidden(base, base[0].id)[0].hidden).toBe(true);
  });

  it("completionItems targets + computeCompletion", () => {
    const personal = { fullName: "A", jobTitle: "Eng", email: "a@b.com", phone: "1", location: "", linkedin: "x", github: "", website: "", photoUrl: null };
    const content = normalizeResumeContent(undefined, {
      sections: { summary: "A reasonably long professional summary sentence." },
      education: [{ id: "e", degree: "B.Tech", institution: "IIT", startYear: "", endYear: "", percentage: "" }],
      skills: { technical: ["React"], soft: [] },
      layout: { order: [], hidden: [] },
    });
    content.push({ ...makeSectionBlock("experience"), entries: [{ id: "x", title: "Eng", subtitle: "Acme", location: "", startDate: "", endDate: "", description: "Did things", url: "", tags: [] }] });
    const items = completionItems(content, personal);
    expect(items.find((i) => i.key === "name")!.target).toEqual({ kind: "personal" });
    expect(items.every((i) => i.done)).toBe(true);
    expect(computeCompletion(content, personal)).toBe(100);
  });
});

describe("buildResumeRenderModel (mobile)", () => {
  it("assembles fullName / jobTitle / contactLine + blocks", () => {
    const { buildResumeRenderModel } = require("@/services/resumeContent");
    const personal = { fullName: "Ada", jobTitle: "Eng", email: "a@b.com", phone: "9", location: "Pune", linkedin: "li/ada", github: "", website: "", photoUrl: null };
    const content = normalizeResumeContent(undefined, {
      sections: { summary: "A long enough professional summary sentence here." },
      education: [{ id: "e", degree: "B.Tech", institution: "IIT", startYear: "", endYear: "", percentage: "" }],
      skills: { technical: ["React"], soft: [] },
      layout: { order: [], hidden: [] },
    });
    const model = buildResumeRenderModel({ personalDetails: personal, content });
    expect(model.fullName).toBe("Ada");
    expect(model.contactLine).toBe("a@b.com · 9 · Pune · li/ada");
    expect(model.blocks.map((b: { type: string }) => b.type)).toEqual(expect.arrayContaining(["summary", "education", "skills"]));
  });
});
