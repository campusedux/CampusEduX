import { describe, expect, it } from "vitest";
import {
  TITLE_MAX,
  TITLE_SUFFIX,
  courseLanguage,
  courseTitle,
  fitTitle,
  interviewCategoryTitle,
  interviewTopicTitle,
  jobTitle,
  lessonTitle,
  plainTitle,
  problemLanguage,
  problemTitle,
  truncateAtWord,
} from "@/lib/seoTitles";

const within = (t: string) => {
  expect(t.length).toBeLessThanOrEqual(TITLE_MAX);
  expect(t.endsWith(TITLE_SUFFIX)).toBe(true);
  // Exactly one brand suffix — the pages pass these as `title.absolute`.
  expect(t.split("CampusEduX").length - 1).toBe(1);
};

describe("lessonTitle", () => {
  it("names the course language with the (with Examples) qualifier when it fits", () => {
    const t = lessonTitle({ topicTitle: "Constructors", gridSlug: "java-tutorial", courseName: "Java Tutorial" });
    expect(t).toBe("Constructors in Java (with Examples) | CampusEduX");
    within(t);
  });

  it("never repeats a language the topic title already names", () => {
    expect(lessonTitle({ topicTitle: "Java Basics", gridSlug: "java-tutorial", courseName: "Java Tutorial" })).toBe(
      "Java Basics (with Examples) | CampusEduX",
    );
    expect(lessonTitle({ topicTitle: "SQL Overview", gridSlug: "dbms-sql-tutorial", courseName: "DBMS & SQL Tutorial" })).toBe(
      "SQL Overview (with Examples) | CampusEduX",
    );
    expect(
      lessonTitle({ topicTitle: "AI vs ML vs Deep Learning", gridSlug: "ai-ml-notes", courseName: "AI/ML Notes" }),
    ).toBe("AI vs ML vs Deep Learning (with Examples) | CampusEduX");
  });

  it("reads SQL statements as SQL and database theory as DBMS", () => {
    expect(lessonTitle({ topicTitle: "CREATE DATABASE", gridSlug: "dbms-sql-tutorial", courseName: "DBMS & SQL Tutorial" })).toBe(
      "CREATE DATABASE in SQL (with Examples) | CampusEduX",
    );
    expect(lessonTitle({ topicTitle: "2NF", gridSlug: "dbms-sql-tutorial", courseName: "DBMS & SQL Tutorial" })).toBe(
      "2NF in DBMS (with Examples) | CampusEduX",
    );
    expect(courseLanguage("dbms-sql-tutorial", "DBMS & SQL Tutorial", "BCNF")).toBe("DBMS");
    expect(courseLanguage("dbms-sql-tutorial", "DBMS & SQL Tutorial", "INNER JOIN")).toBe("SQL");
  });

  it("drops (with Examples), then the language, then truncates at a word boundary", () => {
    const a = lessonTitle({ topicTitle: "Overfitting & Underfitting", gridSlug: "ai-ml-notes", courseName: "AI/ML Notes" });
    expect(a).toBe("Overfitting & Underfitting in Machine Learning | CampusEduX");
    const b = lessonTitle({
      topicTitle: "Data, Information, Metadata and Knowledge",
      gridSlug: "dbms-sql-tutorial",
      courseName: "DBMS & SQL Tutorial",
    });
    expect(b).toBe("Data, Information, Metadata and Knowledge | CampusEduX");
    const c = lessonTitle({
      topicTitle: "Isolation Levels, Read Phenomena and Snapshot Isolation in Practice Today",
      gridSlug: "dbms-sql-tutorial",
      courseName: "DBMS & SQL Tutorial",
    });
    expect(c).toBe("Isolation Levels, Read Phenomena and Snapshot… | CampusEduX");
    [a, b, c].forEach(within);
  });

  it("decodes HTML entities in stored titles", () => {
    expect(lessonTitle({ topicTitle: "Lists &amp; Tuples", gridSlug: "python-tutorial", courseName: "Python Tutorial" })).toBe(
      "Lists & Tuples in Python (with Examples) | CampusEduX",
    );
  });

  it("falls back to an '<X> Tutorial' course name, and to no language for other names", () => {
    expect(lessonTitle({ topicTitle: "Coroutines", gridSlug: "kotlin-tutorial", courseName: "Kotlin Tutorial" })).toBe(
      "Coroutines in Kotlin (with Examples) | CampusEduX",
    );
    expect(lessonTitle({ topicTitle: "Arrays", gridSlug: "preparation-notes", courseName: "Preparation Notes" })).toBe(
      "Arrays (with Examples) | CampusEduX",
    );
  });

  it("gives sibling lessons in different courses distinct titles", () => {
    const java = lessonTitle({ topicTitle: "Arrays", gridSlug: "java-tutorial", courseName: "Java Tutorial" });
    const py = lessonTitle({ topicTitle: "Arrays", gridSlug: "python-tutorial", courseName: "Python Tutorial" });
    expect(java).not.toBe(py);
  });
});

describe("problemTitle / problemLanguage", () => {
  it("uses the single supported language, else the course language, else Coding", () => {
    expect(problemLanguage({ supportedLanguages: ["java"] })).toBe("Java");
    expect(problemLanguage({ supportedLanguages: ["cpp"] })).toBe("C++");
    expect(problemLanguage({ supportedLanguages: ["java", "python"], gridSlug: "python-tutorial" })).toBe("Python");
    expect(problemLanguage({ supportedLanguages: ["java", "python", "c", "cpp", "javascript"] })).toBe("Coding");
    expect(problemLanguage({ supportedLanguages: [], gridSlug: "dbms-sql-tutorial" })).toBe("SQL");
  });

  it("builds '<Problem> – <Language> Practice Problem' and degrades to fit", () => {
    expect(problemTitle({ problemTitle: "Two Sum", language: "Coding" })).toBe("Two Sum – Coding Practice Problem | CampusEduX");
    expect(problemTitle({ problemTitle: "Reverse a String", language: "Java" })).toBe(
      "Reverse a String – Java Practice Problem | CampusEduX",
    );
    const long = problemTitle({ problemTitle: "Best Time to Buy and Sell Stock", language: "Coding" });
    expect(long).toBe("Best Time to Buy and Sell Stock – Practice | CampusEduX");
    const huge = problemTitle({
      problemTitle: "Find the Longest Palindromic Substring Using Manacher's Algorithm Efficiently",
      language: "Java",
    });
    within(huge);
    expect(huge.startsWith("Find the Longest Palindromic Substring")).toBe(true);
  });

  it("does not repeat the language", () => {
    expect(problemTitle({ problemTitle: "Java Hello World", language: "Java" })).toBe(
      "Java Hello World – Practice Problem | CampusEduX",
    );
  });
});

describe("other page titles", () => {
  it("interview topic / category titles", () => {
    expect(interviewTopicTitle({ categoryName: "Java", topicName: "Inheritance" })).toBe(
      "Java Inheritance Interview Questions & Answers | CampusEduX",
    );
    const long = interviewTopicTitle({ categoryName: "Python", topicName: "Environment, CLI & Packaging" });
    within(long);
    expect(long).toContain("Environment, CLI & Packaging");
    expect(interviewTopicTitle({ categoryName: "Java", topicName: "Java Basics" })).toBe(
      "Java Basics Interview Questions & Answers | CampusEduX",
    );
    expect(interviewCategoryTitle("Java")).toBe("Java Interview Questions & Answers by Topic | CampusEduX");
  });

  it("course, job and plain titles", () => {
    expect(courseTitle({ courseName: "Java Tutorial", lessonCount: 150 })).toBe(
      "Java Tutorial – 150 Lessons with Examples | CampusEduX",
    );
    expect(courseTitle({ courseName: "Java Tutorial", lessonCount: 0 })).toBe("Java Tutorial | CampusEduX");
    expect(jobTitle({ title: "Backend Intern", company: "Acme Corp" })).toBe("Backend Intern at Acme Corp | CampusEduX");
    expect(jobTitle({ title: "Senior Platform Reliability Engineer", company: "Some Very Long Company Name" })).toBe(
      "Senior Platform Reliability Engineer | CampusEduX",
    );
    within(plainTitle("A blog post title that is really much too long to fit inside sixty characters"));
  });
});

describe("fitTitle / truncateAtWord", () => {
  it("returns the first candidate that fits", () => {
    expect(fitTitle(["x".repeat(48), "Short"], () => "fallback")).toBe("Short | CampusEduX");
  });

  it("truncates without leaving a dangling joiner", () => {
    expect(truncateAtWord("Environment, CLI & Packaging Tools", 20)).toBe("Environment, CLI…");
    expect(truncateAtWord("short", 20)).toBe("short");
  });
});
