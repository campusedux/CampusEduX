import { describe, it, expect } from "vitest";
import {
  normalizeContent,
  defaultStarterContent,
  contentToLegacyColumns,
  moveBlock,
  reorderBlocks,
  duplicateBlock,
  deleteBlock,
  toggleBlockHidden,
  updateBlock,
  computeCompletion,
  completionItems,
  makeBlock,
  type ResumeContent,
} from "@/lib/resumeBuilder/content";
import { EMPTY_PERSONAL } from "@/lib/resumeBuilder/types";

describe("normalizeContent — legacy upgrade", () => {
  const legacy = {
    sections: { summary: "Pitch text here.", experience: "Did things", projects: "", references: "" },
    education: [{ id: "e1", degree: "B.Tech", institution: "IIT", startYear: "2019", endYear: "2023", percentage: "8.6" }],
    skills: { technical: ["React", "Node"], soft: ["Comms"] },
    layout: { order: ["experience", "summary", "education", "skills"], hidden: ["summary"] },
  };

  it("builds blocks from the legacy columns in layout order, respecting hidden", () => {
    const content = normalizeContent([], legacy);
    expect(content.map((b) => b.type)).toEqual(["experience", "summary", "education", "skills"]);
    expect(content.find((b) => b.type === "summary")?.hidden).toBe(true);
  });

  it("maps a legacy education row into a structured entry", () => {
    const content = normalizeContent(undefined, legacy);
    const edu = content.find((b) => b.type === "education");
    expect(edu?.variant).toBe("entries");
    expect(edu?.entries?.[0]).toMatchObject({ title: "B.Tech", subtitle: "IIT", startDate: "2019", endDate: "2023", description: "Score: 8.6" });
  });

  it("splits skills into Technical / Soft groups and drops empty ones", () => {
    const content = normalizeContent(undefined, { ...legacy, skills: { technical: ["Go"], soft: [] } });
    const skills = content.find((b) => b.type === "skills");
    expect(skills?.groups?.map((g) => g.label)).toEqual(["Technical"]);
  });

  it("skips empty legacy text sections", () => {
    const content = normalizeContent(undefined, legacy);
    expect(content.map((b) => b.type)).not.toContain("projects");
    expect(content.map((b) => b.type)).not.toContain("references");
  });

  it("falls back to the default starter set when there is nothing to upgrade", () => {
    expect(normalizeContent(null, {}).map((b) => b.type)).toEqual(defaultStarterContent().map((b) => b.type));
    expect(normalizeContent([], {}).length).toBe(5);
  });
});

describe("normalizeContent — sanitising a stored array", () => {
  it("keeps a valid array, coerces an unknown type to custom and an invalid variant to the type default", () => {
    const raw = [
      { id: "a", type: "summary", heading: "Summary", variant: "text", hidden: false, text: "hi" },
      { id: "b", type: "made_up", heading: "Weird", variant: "nonsense" },
      { id: "b", type: "experience" }, // duplicate id
    ];
    const content = normalizeContent(raw);
    expect(content).toHaveLength(3);
    expect(content[1].type).toBe("custom");
    expect(content[2].type).toBe("experience");
    expect(content[2].variant).toBe("entries");
    expect(new Set(content.map((b) => b.id)).size).toBe(3); // de-duped
  });

  it("guarantees a tags block always has at least one group", () => {
    const content = normalizeContent([{ id: "s", type: "skills", heading: "Skills", variant: "tags" }]);
    expect(content[0].groups?.length).toBe(1);
  });
});

describe("contentToLegacyColumns", () => {
  it("projects text / entries / tags blocks back onto the legacy columns", () => {
    const content = normalizeContent(undefined, {
      sections: { summary: "S", experience: "E" },
      education: [{ id: "e1", degree: "B.Tech", institution: "IIT", startYear: "2019", endYear: "2023", percentage: "8.6" }],
      skills: { technical: ["React"], soft: ["Comms"] },
      layout: { order: ["summary", "experience", "education", "skills"], hidden: ["experience"] },
    });
    const legacy = contentToLegacyColumns(content);
    expect(legacy.sections.summary).toBe("S");
    expect(legacy.education[0]).toMatchObject({ degree: "B.Tech", institution: "IIT", percentage: "8.6" });
    expect(legacy.skills).toEqual({ technical: ["React"], soft: ["Comms"] });
    expect(legacy.layout.order).toEqual(["summary", "experience", "education", "skills"]);
    expect(legacy.layout.hidden).toEqual(["experience"]);
  });
});

describe("block list helpers", () => {
  const content: ResumeContent = [makeBlock("summary"), makeBlock("experience"), makeBlock("education")];

  it("moveBlock swaps neighbours and is a no-op at the ends", () => {
    expect(moveBlock(content, content[0].id, "up")).toBe(content);
    expect(moveBlock(content, content[0].id, "down").map((b) => b.type)).toEqual(["experience", "summary", "education"]);
  });

  it("reorderBlocks moves a block to another block's position", () => {
    expect(reorderBlocks(content, content[2].id, content[0].id).map((b) => b.type)).toEqual(["education", "summary", "experience"]);
  });

  it("duplicateBlock inserts a copy with a new id right after", () => {
    const next = duplicateBlock(content, content[1].id);
    expect(next).toHaveLength(4);
    expect(next[2].type).toBe("experience");
    expect(next[2].id).not.toBe(content[1].id);
    expect(next[2].heading).toMatch(/copy/i);
  });

  it("deleteBlock / toggleBlockHidden / updateBlock", () => {
    expect(deleteBlock(content, content[1].id).map((b) => b.type)).toEqual(["summary", "education"]);
    expect(toggleBlockHidden(content, content[0].id)[0].hidden).toBe(true);
    expect(updateBlock(content, content[0].id, { heading: "About Me" })[0].heading).toBe("About Me");
  });
});

describe("completionItems", () => {
  it("points an unfinished 'summary' item at the existing summary block, and 'personal' items at personal", () => {
    const content = normalizeContent(undefined, {
      sections: { summary: "" },
      education: [],
      skills: { technical: [], soft: [] },
      layout: { order: [], hidden: [] },
    });
    const items = completionItems(content, EMPTY_PERSONAL);
    const summary = items.find((i) => i.key === "summary")!;
    expect(summary.done).toBe(false);
    // starter set contains a summary block → target should be that block, not a "type" placeholder
    expect(summary.target.kind).toBe("block");
    expect(items.find((i) => i.key === "name")!.target).toEqual({ kind: "personal" });
  });

  it("all items done ⇒ computeCompletion is 100", () => {
    const personal = { ...EMPTY_PERSONAL, fullName: "A", jobTitle: "Eng", email: "a@b.com", phone: "1", linkedin: "x" };
    const content = normalizeContent(undefined, {
      sections: { summary: "A reasonably long professional summary sentence here." },
      education: [{ id: "e", degree: "B.Tech", institution: "IIT", startYear: "", endYear: "", percentage: "" }],
      skills: { technical: ["React"], soft: [] },
      layout: { order: [], hidden: [] },
    });
    content.push({ ...makeBlock("experience"), entries: [{ id: "x", title: "Engineer", subtitle: "Acme", location: "", startDate: "", endDate: "", description: "Did things", url: "", tags: [] }] });
    expect(completionItems(content, personal).every((i) => i.done)).toBe(true);
    expect(computeCompletion(content, personal)).toBe(100);
  });
});

describe("computeCompletion", () => {
  it("is 0 for an all-empty resume and 100 for a full one", () => {
    expect(computeCompletion(defaultStarterContent(), EMPTY_PERSONAL)).toBe(0);

    const personal = { ...EMPTY_PERSONAL, fullName: "A", jobTitle: "Eng", email: "a@b.com", phone: "1", linkedin: "linkedin.com/in/a" };
    const content = normalizeContent(undefined, {
      sections: { summary: "A reasonably long professional summary sentence goes here." },
      education: [{ id: "e", degree: "B.Tech", institution: "IIT", startYear: "", endYear: "", percentage: "" }],
      skills: { technical: ["React"], soft: [] },
      layout: { order: [], hidden: [] },
    });
    content.push({ ...makeBlock("experience"), entries: [{ id: "x", title: "Engineer", subtitle: "Acme", location: "", startDate: "", endDate: "", description: "Did a lot of things here", url: "", tags: [] }] });
    expect(computeCompletion(content, personal)).toBe(100);
  });
});
