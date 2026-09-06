import { describe, it, expect } from "vitest";
import { buildResumeRenderModel } from "@/lib/resumeBuilder/renderModel";
import { EMPTY_PERSONAL } from "@/lib/resumeBuilder/types";
import { makeBlock, type ResumeContent, type ResumeSectionBlock } from "@/lib/resumeBuilder/content";

const personal = { ...EMPTY_PERSONAL, fullName: "Rohan Verma", jobTitle: "SDE Intern", email: "r@x.com", github: "github.com/rv" };

function textBlock(type: Parameters<typeof makeBlock>[0], text: string): ResumeSectionBlock {
  return { ...makeBlock(type), variant: "text", text };
}

describe("buildResumeRenderModel", () => {
  it("builds the contact line from filled personal fields only, in a stable order", () => {
    const model = buildResumeRenderModel({ personalDetails: personal, content: [] });
    expect(model.fullName).toBe("Rohan Verma");
    expect(model.jobTitle).toBe("SDE Intern");
    expect(model.contactLine).toBe("r@x.com · github.com/rv");
  });

  it("falls back to 'Your Name' when the name is blank", () => {
    const model = buildResumeRenderModel({ personalDetails: { ...EMPTY_PERSONAL }, content: [] });
    expect(model.fullName).toBe("Your Name");
  });

  it("skips hidden blocks and blocks with no content", () => {
    const content: ResumeContent = [
      textBlock("summary", "A short pitch."),
      { ...textBlock("objective", "hidden text"), hidden: true },
      textBlock("references", "   "),
    ];
    const model = buildResumeRenderModel({ personalDetails: personal, content });
    expect(model.blocks.map((b) => b.type)).toEqual(["summary"]);
  });

  it("preserves block order", () => {
    const content: ResumeContent = [textBlock("experience", "x"), textBlock("summary", "y"), textBlock("education", "z")];
    const model = buildResumeRenderModel({ personalDetails: personal, content });
    expect(model.blocks.map((b) => b.type)).toEqual(["experience", "summary", "education"]);
  });

  it("turns an entries block into structured entries AND a flat lines fallback", () => {
    const content: ResumeContent = [
      {
        ...makeBlock("experience"),
        entries: [
          {
            id: "x1",
            title: "Engineer",
            subtitle: "Acme",
            location: "Pune",
            startDate: "2023",
            endDate: "Present",
            description: "Built the thing\n- Improved latency 40%",
            url: "acme.com",
            tags: ["React", "Node"],
          },
        ],
      },
    ];
    const model = buildResumeRenderModel({ personalDetails: personal, content });
    const block = model.blocks[0];
    expect(block.variant).toBe("entries");
    expect(block.entries?.[0]).toMatchObject({ title: "Engineer", subtitle: "Acme", meta: "Pune · 2023 – Present", url: "acme.com" });
    expect(block.entries?.[0].bullets).toEqual(["Built the thing", "Improved latency 40%"]);
    // flat fallback still present for the PDF/DOCX text path
    expect(block.lines.some((l) => l.includes("Engineer · Acme · Pune · 2023 – Present"))).toBe(true);
    expect(block.lines).toContain("• Improved latency 40%");
  });

  it("drops empty entries and empty entry blocks", () => {
    const content: ResumeContent = [{ ...makeBlock("projects"), entries: [{ ...emptyEntryLite() }] }];
    const model = buildResumeRenderModel({ personalDetails: personal, content });
    expect(model.blocks).toHaveLength(0);
  });

  it("flattens a tags block to chips + label lines", () => {
    const content: ResumeContent = [
      {
        ...makeBlock("skills"),
        groups: [
          { id: "g1", label: "Technical", items: ["React", "Node"] },
          { id: "g2", label: "Soft", items: ["Comms"] },
          { id: "g3", label: "Empty", items: [] },
        ],
      },
    ];
    const model = buildResumeRenderModel({ personalDetails: personal, content });
    const block = model.blocks[0];
    expect(block.chips).toEqual(["React", "Node", "Comms"]);
    expect(block.lines).toEqual(["Technical: React, Node", "Soft: Comms"]);
  });

  it("renders a links block", () => {
    const content: ResumeContent = [
      { ...makeBlock("coding_profiles"), links: [{ id: "l1", label: "LeetCode", url: "leetcode.com/rv" }, { id: "l2", label: "", url: "" }] },
    ];
    const model = buildResumeRenderModel({ personalDetails: personal, content });
    expect(model.blocks[0].links).toEqual([{ label: "LeetCode", url: "leetcode.com/rv" }]);
  });
});

function emptyEntryLite() {
  return { id: "e", title: "", subtitle: "", location: "", startDate: "", endDate: "", description: "", url: "", tags: [] };
}
