import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
import { renderToStaticMarkup } from "react-dom/server";
import {
  classifyLessonHeading,
  detectLessonStructure,
  lessonSectionKind,
  splitHeadingNumber,
  topicHeadingPrefixes,
} from "@/lib/lessonSections";
import { Markdown } from "@/components/learning/Markdown";

describe("classifyLessonHeading", () => {
  it("recognises the Java lesson template", () => {
    expect(classifyLessonHeading("1. What are JDK, JRE, and JVM?")).toBe("intro");
    expect(classifyLessonHeading("2. Why is it used?")).toBe("why");
    expect(classifyLessonHeading("3. Real-Life Example")).toBe("example");
    expect(classifyLessonHeading("4. Syntax")).toBe("code");
    expect(classifyLessonHeading("5. Example Program")).toBe("code");
    expect(classifyLessonHeading("6. Key Points to Remember")).toBe("keypoints");
    expect(classifyLessonHeading("Practice Problems")).toBe("practice");
  });

  it("maps the other courses' vocabulary", () => {
    expect(classifyLessonHeading("What is it?")).toBe("intro");
    expect(classifyLessonHeading("Important Points")).toBe("keypoints");
    expect(classifyLessonHeading("Key Takeaways / Interview Q&A")).toBe("keypoints");
    expect(classifyLessonHeading("Common Mistakes")).toBe("mistakes");
    expect(classifyLessonHeading("Edge Cases and Pitfalls")).toBe("mistakes");
    expect(classifyLessonHeading("12. Practice task")).toBe("practice");
    expect(classifyLessonHeading("Model deployment: Practice")).toBe("practice");
    expect(classifyLessonHeading("21. Quick Revision")).toBe("revision");
    expect(classifyLessonHeading("18. Interview-Oriented Points")).toBe("interview");
  });

  it("leaves every other heading alone", () => {
    expect(classifyLessonHeading("How It Works")).toBeNull();
    expect(classifyLessonHeading("2. The `for` Loop")).toBeNull();
    expect(classifyLessonHeading("Program 1: Right-Angled Triangle of Stars")).toBeNull();
    expect(classifyLessonHeading("Practice makes perfect")).toBeNull();
    expect(classifyLessonHeading("Syntax errors in Python")).toBeNull();
  });
});

// The Generative AI lessons whose own title reads "What is …" / "Why …" — the
// section headings exactly as stored (live data, 2026-09-25).
const QUESTION_SECTIONS = [
  "How It Works", "Real-World Examples", "Key Characteristics", "Advantages and Limitations",
  "Common Misunderstandings", "Practical Use", "Exam and Viva Preparation", "Practice", "Quick Revision",
];
const PROCESS_SECTIONS = [
  "What It Means", "Why It Is Used", "Step-by-Step Process", "Example with a Real Application",
  "Technical Details", "Quality and Evaluation", "Common Problems", "Practical Implementation",
  "Interview and Viva", "Practice", "Quick Revision",
];
const QUESTION_TITLED_LESSONS: [string, string[]][] = [
  ["What is RAG", QUESTION_SECTIONS],
  ["What is Generative AI", QUESTION_SECTIONS],
  ["What is Prompt Engineering", QUESTION_SECTIONS],
  ["What is an LLM", QUESTION_SECTIONS],
  ["What is an AI Agent", QUESTION_SECTIONS],
  ["What are embeddings", PROCESS_SECTIONS],
  ["Why RAG is required", PROCESS_SECTIONS],
];
const genAiLesson = (title: string, sections: string[]) =>
  [...sections.map((s) => `### ${title}: ${s}\n\nText.`), "### 12. Practice task\n\nDo it.", "### 13. Quick revision\n\nDone."].join("\n\n");

describe("topic-prefixed headings (Generative AI)", () => {
  it.each(QUESTION_TITLED_LESSONS)("classifies %s by its section names, not its title", (title, sections) => {
    const src = genAiLesson(title, sections);
    const prefixes = topicHeadingPrefixes(src);
    expect(prefixes).toEqual(new Set([title.toLowerCase()]));
    const reference = topicHeadingPrefixes(genAiLesson("Image", sections));
    for (const s of sections) {
      expect(lessonSectionKind(`${title}: ${s}`, ["Text."], prefixes), s).toBe(lessonSectionKind(`Image: ${s}`, ["Text."], reference));
    }
    expect(classifyLessonHeading(`${title}: Practice`, prefixes)).toBe("practice");
    expect(classifyLessonHeading(`${title}: Quick Revision`, prefixes)).toBe("revision");
    expect(classifyLessonHeading(`${title}: ${sections[0]}`, prefixes)).toBe(sections[0] === "What It Means" ? "intro" : null);
  });

  it("frames the prefixed Practice section as a card", () => {
    const html = renderToStaticMarkup(Markdown({ source: genAiLesson("What is RAG", QUESTION_SECTIONS), callouts: true, sections: true }));
    // "What is RAG: Practice" and "12. Practice task" — previously only the latter.
    expect(html.match(/<section/g)).toHaveLength(2);
  });

  it("keeps a one-off colon as part of the heading", () => {
    const src = "### Why Table Constraints Exist: The Multi-Column Requirement\n\nx\n\n### Key Takeaways\n\n- a";
    const prefixes = topicHeadingPrefixes(src);
    expect(prefixes.size).toBe(0);
    expect(classifyLessonHeading("Why Table Constraints Exist: The Multi-Column Requirement", prefixes)).toBe("why");
  });
});

describe("lessonSectionKind", () => {
  it("shows a generic example as code only when it holds a code fence", () => {
    expect(lessonSectionKind("Simple Example", ["```python", "print(1)", "```"])).toBe("code");
    expect(lessonSectionKind("Worked example", ["Take a table of students…"])).toBe("example");
    expect(lessonSectionKind("Real-World Example", ["```python", "x = 1", "```"])).toBe("example");
  });
});

describe("splitHeadingNumber", () => {
  it("splits an authored number off the title", () => {
    expect(splitHeadingNumber("6. Key Points to Remember")).toEqual({ number: "6", title: "Key Points to Remember" });
    expect(splitHeadingNumber("Key Points")).toEqual({ number: null, title: "Key Points" });
  });
});

describe("detectLessonStructure", () => {
  it("needs two recognised headings outside code fences", () => {
    expect(detectLessonStructure("## 1. What is Java?\n\ntext\n\n## 2. Why is it used?\n\ntext")).toEqual({ level: 2 });
    expect(detectLessonStructure("## Key Points to Remember\n\n- a")).toBeNull();
    expect(detectLessonStructure("```md\n## Syntax\n## Example Program\n```")).toBeNull();
  });

  it("uses the level the recognised headings share (Python nests them under chapters)", () => {
    const src = "## 1. What are Loops?\n\n### What is it?\n\nx\n\n### Why do we use it?\n\ny\n\n## 2. The for Loop\n\n### Syntax\n\n```python\nfor i in x: pass\n```";
    expect(detectLessonStructure(src)).toEqual({ level: 3 });
  });
});

const JAVA = [
  "## 1. What is Java?",
  "",
  "Java is a language.",
  "",
  "## 5. Example Program",
  "",
  "```java",
  'System.out.println("hi");',
  "```",
  "",
  "**Output:**",
  "```",
  "hi",
  "```",
  "",
  "## 6. Key Points to Remember",
  "",
  "- Point one.",
  "- Point two.",
].join("\n");

describe("Markdown sections", () => {
  it("frames the template sections and keeps heading ids for the TOC", () => {
    const html = renderToStaticMarkup(Markdown({ source: JAVA, callouts: true, sections: true }));
    expect(html).toContain('id="1-what-is-java"');
    expect(html).toContain('id="6-key-points-to-remember"');
    // Example Program: heading, code and Output grouped in one band.
    const band = html.slice(html.indexOf("<section"), html.indexOf("</section>"));
    expect(band).toContain("Example Program");
    expect(band).toContain("hi");
    expect(band).toContain("Output:");
    // Key points become ticks, not a disc list.
    expect(html).not.toContain("list-disc");
    expect(html.match(/<section/g)).toHaveLength(2);
  });

  it("renders a lesson that doesn't follow the template exactly as before", () => {
    const src = "## Overview of questions\n\n- a\n- b\n\n**Q1. What is X?** An answer.\n\n### Syntax\n\ntext";
    const before = renderToStaticMarkup(Markdown({ source: src, callouts: true }));
    expect(renderToStaticMarkup(Markdown({ source: src, callouts: true, sections: true }))).toBe(before);
  });

  it("still cards a lone Key Points section outside the template, leaving the rest as before", () => {
    const src = "**Q1. What is X?** An answer.\n\n## Key Points to Remember\n\n- a\n- b";
    const html = renderToStaticMarkup(Markdown({ source: src, callouts: true, sections: true }));
    const plain = renderToStaticMarkup(Markdown({ source: "**Q1. What is X?** An answer.", callouts: true }));
    expect(html.startsWith(plain.slice(0, -"</div>".length))).toBe(true);
    expect(html.match(/<section/g)).toHaveLength(1);
    expect(html).toContain('id="key-points-to-remember"');
    expect(html).not.toContain("list-disc");
  });

  it("is off unless asked for (blog / problem statements unchanged)", () => {
    expect(renderToStaticMarkup(Markdown({ source: JAVA, callouts: true }))).not.toContain("<section");
  });

  it("turns a Practice block into numbered questions with answers", () => {
    const src = "Try each first.\n\n### 1. Run only\n\nWhat do you install?\n\n**Answer:** The JRE.\n\n### 2. Equations\n\nWrite them.";
    const html = renderToStaticMarkup(Markdown({ source: src, callouts: true, sectionBody: "practice" }));
    expect(html).toContain('id="1-run-only"');
    expect(html).toContain("<details");
    expect(html).toContain("Show answer");
    expect(html).toContain("The JRE.");
    expect(html).not.toContain("**Answer:**");
    expect(html).toMatch(/>1<\/span>[\s\S]*>2<\/span>/);
  });
});
