import { buildAtsAnalysis } from "@/services/atsCategories";
import { makeSectionBlock } from "@/services/resumeContent";
import type { ATSBreakdown, ResumeContent, ResumePersonalDetails } from "@/types";

const EMPTY_PD: ResumePersonalDetails = {
  fullName: "", jobTitle: "", email: "", phone: "", location: "", linkedin: "", github: "", website: "", photoUrl: null,
};

const RPC: ATSBreakdown = {
  overall: 74,
  content: 80,
  formatting: 82,
  skills: 55,
  keywords: 48,
  completeness: 70,
  readability: 90,
  tips: [
    { ruleId: "we-2", section: "work_experience", problem: "Quantify impact", why: "Add numbers.", importance: "critical", checked: true },
    { ruleId: "sk-1", section: "skills", problem: "Group skills by category", why: "Languages, Frameworks…", importance: "medium", checked: true },
    { ruleId: "gen-1", section: "general", problem: "Match keywords from the job description", why: "Mirror phrasing.", importance: "high", checked: false },
  ],
};

function fullContent(): ResumeContent {
  return [
    { ...makeSectionBlock("summary"), variant: "text", text: "Software engineer with three years building web products in TypeScript." },
    {
      ...makeSectionBlock("experience"),
      entries: [
        { id: "e1", title: "Software Engineer", subtitle: "Acme", location: "Pune", startDate: "2022", endDate: "Present", description: "Built a design system used by 6 teams\nReduced API latency 38%\nLed the billing migration", url: "", tags: [] },
      ],
    },
    { ...makeSectionBlock("education"), entries: [{ id: "ed1", title: "B.Tech CS", subtitle: "IIT", location: "", startDate: "2018", endDate: "2022", description: "CGPA 8.6", url: "", tags: [] }] },
    { ...makeSectionBlock("skills"), groups: [{ id: "g1", label: "Languages", items: ["TypeScript", "Go", "SQL", "Python"] }, { id: "g2", label: "Tools", items: ["Docker", "AWS", "Redis", "CI/CD", "Postgres"] }] },
  ];
}

describe("buildAtsAnalysis (mobile) — must match the website output", () => {
  it("returns exactly the 7 named categories in order", () => {
    const a = buildAtsAnalysis(RPC, fullContent(), { ...EMPTY_PD, fullName: "A", email: "a@b.com", phone: "9", location: "Pune", linkedin: "x" });
    expect(a.categories.map((c) => c.label)).toEqual(["Contact Information", "Keywords", "Skills", "Experience", "Education", "Formatting", "Readability"]);
  });

  it("overall is unchanged; RPC scores pass through for keywords/skills/formatting/readability", () => {
    const a = buildAtsAnalysis(RPC, fullContent(), EMPTY_PD);
    expect(a.overall).toBe(74);
    expect(a.categories.find((c) => c.key === "keywords")!.score).toBe(48);
    expect(a.categories.find((c) => c.key === "readability")!.score).toBe(90);
  });

  it("Contact is deterministic: 0 empty, 100 full", () => {
    expect(buildAtsAnalysis(RPC, fullContent(), EMPTY_PD).categories.find((c) => c.key === "contact")!.score).toBe(0);
    const full = { ...EMPTY_PD, fullName: "A", email: "a@b.com", phone: "9", location: "Pune", github: "gh/a" };
    expect(buildAtsAnalysis(RPC, fullContent(), full).categories.find((c) => c.key === "contact")!.score).toBe(100);
  });

  it("Experience score is stable and rewards action verbs + numbers", () => {
    const s1 = buildAtsAnalysis(RPC, fullContent(), EMPTY_PD).categories.find((c) => c.key === "experience")!.score;
    const s2 = buildAtsAnalysis(RPC, fullContent(), EMPTY_PD).categories.find((c) => c.key === "experience")!.score;
    expect(s1).toBe(s2);
    expect(s1).toBeGreaterThan(70);
  });

  it("Education weak with no entry; RPC tips route into their category", () => {
    const noEdu = fullContent().filter((b) => b.type !== "education");
    expect(buildAtsAnalysis(RPC, noEdu, EMPTY_PD).categories.find((c) => c.key === "education")!.status).toBe("weak");
    const a = buildAtsAnalysis(RPC, fullContent(), EMPTY_PD);
    expect(a.categories.find((c) => c.key === "experience")!.weak).toContain("Quantify impact");
    expect(a.categories.find((c) => c.key === "keywords")!.weak).toContain("Match keywords from the job description");
  });

  it("every category has a status and at least one good/weak line", () => {
    for (const c of buildAtsAnalysis(RPC, fullContent(), EMPTY_PD).categories) {
      expect(["strong", "ok", "weak"]).toContain(c.status);
      expect(c.good.length + c.weak.length).toBeGreaterThan(0);
    }
  });
});
