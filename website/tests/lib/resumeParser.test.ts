import { describe, it, expect } from "vitest";
import { parseResumeText } from "@/lib/resumeBuilder/parser";

const CLEAN_RESUME = `Rohan Verma
rohan.verma@email.com | +91 98765 43210
linkedin.com/in/rohanverma | github.com/rohanverma | rohanverma.dev

Summary
Software engineer with 3 years of experience building scalable web applications.

Experience
Software Engineer — Acme Corp (Jun 2022 - Present)
- Built and led a small team shipping production features
- Improved API latency by 40%

Education
B.Tech Computer Science, IIT Bombay, 2018-2022
Higher Secondary, DPS Delhi, 2016 - 2018

Skills
React, Node.js, PostgreSQL, TypeScript, Docker

Projects
E-Commerce Platform — React, Node.js, MongoDB
- Built a full-stack shopping app with cart and checkout

Certifications
AWS Certified Cloud Practitioner (2023)
`;

const MESSY_RESUME = `ROHAN VERMA
Just a bunch of unstructured text describing my career with no clear section headers at all,
mentioning that I worked at a company and built some things, contact me at rohan@x.com or
call +91 99999 88888, my linkedin is linkedin.com/in/rohanverma.
More paragraphs follow with achievements and skills all mixed together in prose form,
never organized under any recognizable heading like the ones a parser would look for.
`;

describe("parseResumeText — clean single-column resume", () => {
  const result = parseResumeText(CLEAN_RESUME);

  it("extracts contact info", () => {
    expect(result.contact.fullName).toBe("Rohan Verma");
    expect(result.contact.email).toBe("rohan.verma@email.com");
    expect(result.contact.linkedin).toBe("linkedin.com/in/rohanverma");
    expect(result.contact.github).toBe("github.com/rohanverma");
    expect(result.contact.website).toBe("rohanverma.dev");
  });

  it("detects the summary/experience/projects/certifications sections", () => {
    expect(result.sections.summary).toContain("Software engineer with 3 years");
    expect(result.sections.experience).toContain("Acme Corp");
    expect(result.sections.projects).toContain("E-Commerce Platform");
    expect(result.sections.certifications).toContain("AWS Certified");
  });

  it("parses education entries with year ranges", () => {
    expect(result.education).toHaveLength(2);
    expect(result.education[0]).toMatchObject({ startYear: "2018", endYear: "2022" });
    expect(result.education[1]).toMatchObject({ startYear: "2016", endYear: "2018" });
  });

  it("splits the skills line into individual skills", () => {
    expect(result.skills).toEqual(expect.arrayContaining(["React", "Node.js", "PostgreSQL", "TypeScript", "Docker"]));
  });

  it("has no leftover unrecognized text for a well-structured resume", () => {
    expect(result.unrecognizedText.trim()).toBe("");
  });
});

describe("parseResumeText — messy resume with no clear headings", () => {
  const result = parseResumeText(MESSY_RESUME);

  it("still extracts contact info from free-flowing prose", () => {
    expect(result.contact.email).toBe("rohan@x.com");
    expect(result.contact.linkedin).toBe("linkedin.com/in/rohanverma");
  });

  it("falls back to unrecognizedText instead of throwing or silently dropping content", () => {
    expect(() => parseResumeText(MESSY_RESUME)).not.toThrow();
    expect(result.unrecognizedText.length).toBeGreaterThan(0);
    expect(result.unrecognizedText).toContain("unstructured text");
  });

  it("returns empty structured sections/education/skills rather than guessing wrongly", () => {
    expect(Object.keys(result.sections)).toHaveLength(0);
    expect(result.education).toHaveLength(0);
    expect(result.skills).toHaveLength(0);
  });
});

describe("parseResumeText — edge cases", () => {
  it("handles an empty string without throwing", () => {
    expect(() => parseResumeText("")).not.toThrow();
    const result = parseResumeText("");
    expect(result.unrecognizedText).toBe("");
  });

  it("keeps an unparseable education line as leftover text instead of dropping it", () => {
    const result = parseResumeText("Education\nSome scholarship program, no dates mentioned\n");
    expect(result.education).toHaveLength(0);
    expect(result.unrecognizedText).toContain("Some scholarship program");
  });

  it("treats 'present' as an in-progress end year", () => {
    const result = parseResumeText("Education\nMBA, XYZ University, 2023 - Present\n");
    expect(result.education[0]).toMatchObject({ startYear: "2023", endYear: "Present" });
  });
});
