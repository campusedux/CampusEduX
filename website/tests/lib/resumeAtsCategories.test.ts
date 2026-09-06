import { describe, it, expect } from "vitest";
import { buildAtsAnalysis } from "@/lib/resumeBuilder/atsCategories";
import { makeBlock, type ResumeContent } from "@/lib/resumeBuilder/content";
import { EMPTY_PERSONAL, type ATSBreakdown } from "@/lib/resumeBuilder/types";

const RPC: ATSBreakdown = {
  overall: 74,
  content: 80,
  formatting: 82,
  skills: 55,
  keywords: 48,
  completeness: 70,
  readability: 90,
  tips: [
    { ruleId: "we-2", section: "work_experience", problem: "Quantify impact", why: "Add numbers: %, ₹, time saved, users.", importance: "critical", checked: true },
    { ruleId: "sk-1", section: "skills", problem: "Group skills by category", why: "Languages, Frameworks, Tools, Databases.", importance: "medium", checked: true },
    { ruleId: "gen-1", section: "general", problem: "Match keywords from the job description", why: "Mirror the exact phrasing where truthful.", importance: "high", checked: false },
  ],
};

function fullContent(): ResumeContent {
  return [
    { ...makeBlock("summary"), variant: "text", text: "Software engineer with three years building web products in TypeScript and Node." },
    {
      ...makeBlock("experience"),
      entries: [
        {
          id: "e1",
          title: "Software Engineer",
          subtitle: "Acme",
          location: "Pune",
          startDate: "2022",
          endDate: "Present",
          description: "Built a design system used by 6 teams\nReduced API latency 38%\nLed the billing migration",
          url: "",
          tags: [],
        },
      ],
    },
    { ...makeBlock("education"), entries: [{ id: "ed1", title: "B.Tech CS", subtitle: "IIT", location: "", startDate: "2018", endDate: "2022", description: "CGPA 8.6", url: "", tags: [] }] },
    { ...makeBlock("skills"), groups: [{ id: "g1", label: "Languages", items: ["TypeScript", "Go", "SQL", "Python"] }, { id: "g2", label: "Tools", items: ["Docker", "AWS", "Redis", "CI/CD", "Postgres"] }] },
  ];
}

describe("buildAtsAnalysis", () => {
  it("returns exactly the 7 named categories in order", () => {
    const a = buildAtsAnalysis(RPC, fullContent(), { ...EMPTY_PERSONAL, fullName: "A", email: "a@b.com", phone: "9", location: "Pune", linkedin: "x" });
    expect(a.categories.map((c) => c.key)).toEqual(["contact", "keywords", "skills", "experience", "education", "formatting", "readability"]);
    expect(a.categories.map((c) => c.label)).toEqual([
      "Contact Information",
      "Keywords",
      "Skills",
      "Experience",
      "Education",
      "Formatting",
      "Readability",
    ]);
  });

  it("overall is the RPC's number unchanged", () => {
    expect(buildAtsAnalysis(RPC, fullContent(), EMPTY_PERSONAL).overall).toBe(74);
  });

  it("passes the RPC scores straight through for keywords / skills / formatting / readability", () => {
    const a = buildAtsAnalysis(RPC, fullContent(), EMPTY_PERSONAL);
    expect(a.categories.find((c) => c.key === "keywords")!.score).toBe(48);
    expect(a.categories.find((c) => c.key === "skills")!.score).toBe(55);
    expect(a.categories.find((c) => c.key === "readability")!.score).toBe(90);
  });

  it("Contact Information is deterministic from personal fields (0 when empty, 100 when all present)", () => {
    expect(buildAtsAnalysis(RPC, fullContent(), EMPTY_PERSONAL).categories.find((c) => c.key === "contact")!.score).toBe(0);
    const full = { ...EMPTY_PERSONAL, fullName: "A", email: "a@b.com", phone: "9", location: "Pune", github: "gh/a" };
    expect(buildAtsAnalysis(RPC, fullContent(), full).categories.find((c) => c.key === "contact")!.score).toBe(100);
  });

  it("Experience score rewards entries + action verbs + quantified bullets, and is stable for the same input", () => {
    const exp = buildAtsAnalysis(RPC, fullContent(), EMPTY_PERSONAL).categories.find((c) => c.key === "experience")!;
    const exp2 = buildAtsAnalysis(RPC, fullContent(), EMPTY_PERSONAL).categories.find((c) => c.key === "experience")!;
    expect(exp.score).toBe(exp2.score); // deterministic
    expect(exp.score).toBeGreaterThan(70);
    expect(exp.good.join(" ")).toMatch(/action verb/i);
  });

  it("Education is weak when there is no education entry", () => {
    const noEdu = fullContent().filter((b) => b.type !== "education");
    const edu = buildAtsAnalysis(RPC, noEdu, EMPTY_PERSONAL).categories.find((c) => c.key === "education")!;
    expect(edu.score).toBeLessThan(55);
    expect(edu.status).toBe("weak");
    expect(edu.weak.join(" ")).toMatch(/add your degree/i);
  });

  it("routes RPC rule tips into the matching category", () => {
    const a = buildAtsAnalysis(RPC, fullContent(), EMPTY_PERSONAL);
    expect(a.categories.find((c) => c.key === "experience")!.weak).toContain("Quantify impact");
    expect(a.categories.find((c) => c.key === "skills")!.weak).toContain("Group skills by category");
    expect(a.categories.find((c) => c.key === "keywords")!.weak).toContain("Match keywords from the job description");
  });

  it("every category has a status, at least one good-or-weak line, and (mostly) a jump target", () => {
    const a = buildAtsAnalysis(RPC, fullContent(), { ...EMPTY_PERSONAL, photoUrl: "https://x/p.png" });
    for (const c of a.categories) {
      expect(["strong", "ok", "weak"]).toContain(c.status);
      expect(c.good.length + c.weak.length).toBeGreaterThan(0);
    }
    // a set photo makes Formatting offer a jump to personal details
    expect(a.categories.find((c) => c.key === "formatting")!.target).toEqual({ kind: "personal" });
    expect(a.categories.find((c) => c.key === "experience")!.target).toEqual({ kind: "block", blockId: expect.any(String) });
  });
});
