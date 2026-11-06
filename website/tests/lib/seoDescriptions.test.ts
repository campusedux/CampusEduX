import { describe, expect, it } from "vitest";
import {
  META_DESCRIPTION_MAX,
  META_DESCRIPTION_MIN,
  authoredDescription,
  cleanText,
  courseDescription,
  decodeEntities,
  fitDescription,
  interviewCategoryDescription,
  interviewTopicDescription,
  isRealSummary,
  joinList,
  lessonDescription,
  lessonHeadings,
  problemDescription,
} from "@/lib/metaDescription";
import { lessonFaqPairs } from "@/lib/lessonFaq";
import { techArticleJsonLd } from "@/lib/seo";
import { renderOgCard } from "@/lib/ogImage";

const inRange = (d: string) => {
  expect(d.length).toBeGreaterThanOrEqual(META_DESCRIPTION_MIN);
  expect(d.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX);
};

// Shapes of the real seeded lesson bodies (Java 0047, DBMS 0092+, AI/ML 0068).
const javaBody = (definition: string) =>
  [
    `## 1. What is it?\n${definition}`,
    "## 2. Why is it used?\nBecause.",
    "## 3. Real-Life Example\nA car.",
    "## 4. Syntax\n```java\nclass A {}\n```",
    "## 5. Example Program\nx",
    "## 6. Key Points to Remember\n- one",
  ].join("\n\n");
const dbmsBody = (definition: string) =>
  [
    `### Definition\n${definition}`,
    "### How It Works — A College Example\nx",
    "### Edge Cases and Pitfalls\nx",
    "### Key Takeaways / Interview Q&A\nx",
  ].join("\n\n");

describe("decodeEntities / cleanText", () => {
  it("decodes named, decimal and hex entities in one pass", () => {
    expect(decodeEntities("A &amp; B &quot;q&quot; it&#39;s it&#x27;s a&nbsp;b &#8212; &amp;lt;")).toBe(
      "A & B \"q\" it's it's a b — &lt;",
    );
  });

  it("leaves unknown or malformed entities alone", () => {
    expect(decodeEntities("&bogus; &#xZZ; & plain")).toBe("&bogus; &#xZZ; & plain");
  });

  it("strips Markdown and collapses whitespace", () => {
    expect(cleanText("  **Bold**   `code`\n\n_x_ &amp; y ")).toBe("Bold code x & y");
  });
});

describe("fitDescription", () => {
  it("adds whole parts while they fit, then fills to the minimum at a word boundary", () => {
    const d = fitDescription([
      "Short lead sentence about the page.",
      "A second sentence that is long enough to push the total well past the one hundred and fifty five character ceiling for sure.",
    ]);
    inRange(d);
    expect(d.endsWith("…")).toBe(true);
    expect(d).not.toMatch(/\s…$/);
  });

  it("skips a short fixed sentence that doesn't fit instead of cutting it", () => {
    const lead = "x".repeat(130) + ".";
    expect(fitDescription([lead, "Premium lesson on CampusEduX today."])).toBe(lead);
  });

  it("never exceeds the maximum even for one huge part", () => {
    expect(fitDescription(["word ".repeat(100)]).length).toBeLessThanOrEqual(META_DESCRIPTION_MAX);
  });
});

describe("isRealSummary", () => {
  it("rejects boilerplate, stubs, the title itself and shared text", () => {
    expect(isRealSummary("Complete learning notes")).toBe(false);
    expect(isRealSummary("Too short to be useful.")).toBe(false);
    const good = "Understand Dependency Injection in Spring Boot with a food delivery example and constructor injection.";
    expect(isRealSummary(good)).toBe(true);
    expect(isRealSummary(good, { duplicateCount: 3 })).toBe(false);
    expect(isRealSummary(good, { title: good })).toBe(false);
  });
});

describe("lessonHeadings / joinList", () => {
  it("keeps specific headings, drops numbering, questions, generic and example headings", () => {
    expect(lessonHeadings([{ body: javaBody("A constructor is special."), content_format: "markdown" }], { topicTitle: "Constructors" })).toEqual([
      "syntax",
      "key points to remember",
    ]);
    expect(lessonHeadings([{ body: dbmsBody("x"), content_format: "markdown" }], { topicTitle: "2NF" })).toEqual([
      "how it works",
      "edge cases and pitfalls",
      "key takeaways",
    ]);
  });

  it("keeps proper nouns and acronyms capitalised", () => {
    expect(
      lessonHeadings([{ heading: "Spring Beans and JDBC Templates", body: "", content_format: "markdown" }], {
        keepWords: ["Spring Boot"],
      }),
    ).toEqual(["Spring beans and JDBC templates"]);
  });

  it("joins with a serial comma only when an item has its own 'and'", () => {
    expect(joinList(["a", "b", "c"])).toBe("a, b and c");
    expect(joinList(["a", "b and c", "d"])).toBe("a, b and c, and d");
    expect(joinList(["a"])).toBe("a");
  });
});

describe("lessonDescription", () => {
  it("composes a 140–155 char summary from language, headings and course (DBMS: no short description)", () => {
    const d = lessonDescription({
      topicTitle: "2NF",
      shortDescription: "",
      language: "DBMS",
      courseName: "DBMS & SQL Tutorial",
      sectionName: "Chapter 21: Normalization",
      blocks: [{ heading: "", body: dbmsBody("A relation is in Second Normal Form (2NF) if it is in 1NF and has no partial dependency."), content_format: "markdown" }],
    });
    inRange(d);
    expect(d.startsWith("Learn 2NF in DBMS with examples: how it works")).toBe(true);
    expect(d).toContain("DBMS & SQL Tutorial");
  });

  it("ignores boilerplate short descriptions (AI/ML 'Complete learning notes')", () => {
    const d = lessonDescription({
      topicTitle: "ROC-AUC Curve",
      shortDescription: "Complete learning notes",
      shortDescriptionDuplicates: 78,
      language: "Machine Learning",
      courseName: "AI/ML Notes",
      sectionName: "All Topics",
      blocks: [
        {
          heading: "",
          body: "### 1. Introduction\nThe ROC curve plots TPR against FPR.\n### 5. Core Concepts\nx\n### 7. How It Works\nx\n### 12. Advantages\nx",
          content_format: "markdown",
        },
      ],
    });
    inRange(d);
    expect(d).not.toContain("Complete learning notes");
    expect(d).toContain("ROC-AUC Curve in Machine Learning");
    expect(d).not.toContain("All Topics");
  });

  it("keeps a real authored summary (Spring Boot) and tops it up with the course when short", () => {
    const summary = "Method Level Security in Spring Boot: use @PreAuthorize, @PostAuthorize and @PostFilter to guard service methods.";
    const d = lessonDescription({
      topicTitle: "Method Level Security",
      shortDescription: summary,
      language: null,
      courseName: "Spring Boot Tutorial",
      blocks: [],
    });
    expect(d.startsWith(summary)).toBe(true);
    expect(d).toBe(`${summary} Spring Boot Tutorial on CampusEduX.`);
    inRange(d);
    expect(d.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX);
  });

  it("describes a locked premium lesson without its (withheld) body", () => {
    const d = lessonDescription({
      topicTitle: "Streams API",
      language: "Java",
      courseName: "Java Tutorial",
      sectionName: "Advanced Java",
      blocks: [],
      isPremium: true,
    });
    expect(d).toContain("Streams API in Java");
    expect(d).toContain("Premium lesson.");
    expect(d.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX);
  });

  it("gives every sibling in a templated course a unique description", () => {
    const topics = ["Constructors", "Inheritance", "Polymorphism", "Encapsulation", "Abstraction", "Interface"];
    const out = topics.map((t) =>
      lessonDescription({
        topicTitle: t,
        language: "Java",
        courseName: "Java Tutorial",
        sectionName: "Object-Oriented Programming",
        blocks: [{ heading: "", body: javaBody(`${t} is a core idea of object-oriented Java programs and appears in every interview.`), content_format: "markdown" }],
      }),
    );
    expect(new Set(out).size).toBe(topics.length);
    out.forEach(inRange);
    out.forEach((d) => expect(d).not.toMatch(/&(amp|quot|#\d+);/));
  });
});

describe("problem / interview / course descriptions", () => {
  it("unlocked problem: kind line then the real statement, entity-decoded", () => {
    const d = problemDescription({
      title: "Activity Selection",
      difficulty: "Medium",
      language: "Coding",
      topicName: "Greedy",
      statement: "Given  N  activities with start &amp; finish times, select the maximum number of activities one person can do, where a person can only work on one activity at a time.",
      locked: false,
    });
    inRange(d);
    expect(d.startsWith("Activity Selection is a Medium coding practice problem on Greedy.")).toBe(true);
    expect(d).toContain("start & finish");
  });

  it("locked problem: only what the premium gate shows", () => {
    const d = problemDescription({
      title: "Trapping Rain Water",
      difficulty: "Hard",
      language: "Java",
      topicName: "Arrays",
      statement: null,
      locked: true,
    });
    expect(d).toContain("Trapping Rain Water is a Hard Java practice problem on Arrays.");
    expect(d.toLowerCase()).toContain("premium");
    expect(d.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX);
  });

  it("interview topic and category descriptions use real counts", () => {
    const d = interviewTopicDescription({
      categoryName: "Java",
      topicName: "Inheritance",
      topicDescription: "Inheritance, the super keyword, method hiding, and the diamond problem.",
      questions: Array.from({ length: 12 }, () => ({ example: "x", important_point: "y" })),
    });
    inRange(d);
    expect(d.startsWith("12 Java Inheritance interview questions with clear answers, code examples and key points")).toBe(true);
    const c = interviewCategoryDescription({
      categoryName: "Java",
      categoryDescription: "Core Java interview preparation.",
      topics: [
        { name: "OOP", question_count: 10 },
        { name: "Strings", question_count: 8 },
        { name: "Collections", question_count: 12 },
        { name: "JVM", question_count: 6 },
      ],
    });
    expect(c.startsWith("Java interview questions and answers across 4 topics (36 questions), including OOP, Strings and Collections.")).toBe(true);
    expect(c.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX);
  });

  it("course description tops up the authored text with the real lesson count", () => {
    const d = courseDescription({ courseName: "Java Tutorial", description: "Complete Core Java course.", lessonCount: 150, chapterCount: 14 });
    expect(d).toBe("Complete Core Java course. Java Tutorial: 150 lessons across 14 chapters with examples, on CampusEduX.");
  });

  it("authoredDescription cleans and clamps", () => {
    expect(authoredDescription("A &amp; B")).toBe("A & B");
    expect(authoredDescription("", "Fallback &quot;x&quot;")).toBe('Fallback "x"');
    expect(authoredDescription("word ".repeat(60)).length).toBeLessThanOrEqual(META_DESCRIPTION_MAX);
  });
});

describe("lessonFaqPairs", () => {
  it("extracts the same bold-question paragraphs and Q-marked list items the renderer shows", () => {
    const body = [
      "## Interview Questions",
      "**Q1. What is a constructor?**",
      "A special method that runs when an **object** is created.",
      "",
      "**What goes in?** Identify the input.", // not a question-answer? it is: bold question + answer on same line
      "",
      "- **Q: Can a constructor be private?** Yes — used by singletons.",
      "- **Is this a checklist?** A plain bold-labelled bullet, not Q&A.",
      "",
      "```java",
      "**Q: Inside code?** no",
      "```",
      "",
      "**Which is valid?**",
      "a) one",
      "b) two",
    ].join("\n");
    const pairs = lessonFaqPairs([{ body, content_format: "markdown" }]);
    expect(pairs).toEqual([
      { question: "What is a constructor?", answer: "A special method that runs when an object is created." },
      { question: "What goes in?", answer: "Identify the input." },
      { question: "Can a constructor be private?", answer: "Yes — used by singletons." },
    ]);
  });

  it("skips plain-format blocks and returns nothing for prose-only lessons", () => {
    expect(lessonFaqPairs([{ body: "**Q: What?** Answer.", content_format: "plain" }])).toEqual([]);
    expect(lessonFaqPairs([{ body: "Just prose.\n\nMore prose.", content_format: "markdown" }])).toEqual([]);
  });

  it("preserves literal code identifiers in the visible question and answer", () => {
    const [pair] = lessonFaqPairs([{ body: "**Q: What is `TIMED_WAITING`?** The `department_summary` example uses `SELECT *`." }]);
    expect(pair.question).toContain("TIMED_WAITING");
    expect(pair.answer).toContain("department_summary");
    expect(pair.answer).toContain("SELECT *");
    expect(pair.answer).not.toContain("`");
  });
});

describe("techArticleJsonLd", () => {
  it("emits TechArticle with real fields, Course isPartOf and the org as author/publisher", () => {
    const ld = techArticleJsonLd({
      headline: "Constructors",
      description: "d",
      path: "/learning/java-tutorial/constructors",
      courseName: "Java Tutorial",
      coursePath: "/learning/java-tutorial",
      sectionName: "OOP",
      dateModified: "2026-09-01T10:00:00Z",
      imagePath: "/learning/java-tutorial/constructors/opengraph-image",
      isPremium: false,
    });
    expect(ld).toMatchObject({
      "@type": "TechArticle",
      headline: "Constructors",
      inLanguage: "en",
      learningResourceType: "Lesson",
      url: "https://www.campusedux.com/learning/java-tutorial/constructors",
      dateModified: "2026-09-01T10:00:00Z",
      articleSection: "OOP",
      author: { "@type": "Organization", name: "CampusEduX" },
      publisher: { "@type": "Organization", name: "CampusEduX" },
      isPartOf: { "@type": "Course", name: "Java Tutorial", url: "https://www.campusedux.com/learning/java-tutorial" },
      isAccessibleForFree: true,
      image: "https://www.campusedux.com/learning/java-tutorial/constructors/opengraph-image",
    });
  });

  it("omits an invalid date and makes no free-access claim for a premium lesson", () => {
    const ld = techArticleJsonLd({
      headline: "x",
      description: "d",
      path: "/p",
      courseName: "C",
      coursePath: "/c",
      dateModified: "not a date",
      isPremium: true,
    });
    expect(ld).not.toHaveProperty("dateModified");
    expect(ld).not.toHaveProperty("isAccessibleForFree");
    expect(ld).not.toHaveProperty("image");
  });
});

describe("renderOgCard", () => {
  it("returns a PNG ImageResponse for long and missing titles", () => {
    expect(renderOgCard({ title: "A".repeat(300), eyebrow: "Java Tutorial", footer: "OOP" }).status).toBe(200);
    expect(renderOgCard({ title: "" }).status).toBe(200);
  });
});
