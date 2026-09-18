/**
 * Pure types + helpers for Practice → Interview Questions.
 * No React / server imports, so this is safe to unit-test and to import from
 * client components.
 *
 * Backed by `interview_categories` / `interview_topics` / `interview_questions`
 * (migration 0103/075) — a category is a language/track (e.g. "Java"), a topic
 * is a subject within that track (e.g. "OOP"), and a question is one
 * Question/Answer/Example/Important Point row. Separate from both Learning and
 * the existing Practice → Coding Problems system (dsa_topics/dsa_problems).
 */

export const INTERVIEW_DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
export type InterviewDifficulty = (typeof INTERVIEW_DIFFICULTIES)[number];

export interface InterviewCategory {
  slug: string;
  name: string;
  description: string;
  icon: string;
  topic_count: number;
}

export interface InterviewTopicSummary {
  slug: string;
  name: string;
  description: string;
  question_count: number;
}

export interface InterviewTopicsPage {
  category: { slug: string; name: string; description: string };
  topics: InterviewTopicSummary[];
}

export interface InterviewQuestion {
  question: string;
  answer: string;
  example: string;
  important_point: string;
  difficulty: InterviewDifficulty;
}

export interface InterviewTopicAdjacent {
  slug: string;
  name: string;
}

export interface InterviewTopicDetail {
  category: { slug: string; name: string };
  topic: { slug: string; name: string; description: string };
  questions: InterviewQuestion[];
  prev: InterviewTopicAdjacent | null;
  next: InterviewTopicAdjacent | null;
}

/** Breadcrumb for the Interview Questions area, growing from the hub down to
 *  (optionally) a category and a topic — mirrors `practiceCrumbs()`. */
export function interviewQuestionsCrumbs(opts?: {
  categoryName?: string;
  categorySlug?: string;
  topicName?: string;
}): { label: string; href?: string }[] {
  const crumbs: { label: string; href?: string }[] = [
    { label: "Practice", href: "/practice" },
    { label: "Interview Questions", href: "/practice/interview-questions" },
  ];
  if (opts?.categoryName && opts.categorySlug) {
    crumbs.push({
      label: opts.categoryName,
      href: opts.topicName ? `/practice/interview-questions/${opts.categorySlug}` : undefined,
    });
  }
  if (opts?.topicName) crumbs.push({ label: opts.topicName });
  return crumbs;
}

/** A curated "Related Learning" link per Java Interview Questions topic slug,
 *  pointing into the real, already-seeded Learning → Java Tutorials topics
 *  (grid slug `java-tutorial`) confirmed against `0047_seed_java_tutorial_content.sql`.
 *  Topics with no direct Learning counterpart (Spring, Spring Boot,
 *  JPA/Hibernate, REST API) fall back to the Java Tutorials grid root;
 *  "SQL + Java" points into the separate DBMS & SQL Tutorial grid (confirmed
 *  in `0092_seed_dbms_sql_tutorial_ch1_ch2_ch8.sql`). `null` is never used —
 *  every topic gets a link, per this feature's Related Learning requirement. */
export const JAVA_TOPIC_LEARNING_LINKS: Record<string, { href: string; label: string }> = {
  "core-java": { href: "/learning/java-tutorial/introduction-to-java", label: "Introduction to Java" },
  oop: { href: "/learning/java-tutorial", label: "Java Tutorials — Object-Oriented Programming" },
  "classes-objects": { href: "/learning/java-tutorial/class", label: "Class" },
  constructors: { href: "/learning/java-tutorial/constructors", label: "Constructors" },
  inheritance: { href: "/learning/java-tutorial/inheritance", label: "Inheritance" },
  polymorphism: { href: "/learning/java-tutorial/polymorphism", label: "Polymorphism" },
  encapsulation: { href: "/learning/java-tutorial/encapsulation", label: "Encapsulation" },
  abstraction: { href: "/learning/java-tutorial/abstraction", label: "Abstraction" },
  strings: { href: "/learning/java-tutorial/string", label: "String" },
  arrays: { href: "/learning/java-tutorial/arrays", label: "Arrays" },
  collections: { href: "/learning/java-tutorial/collection-framework", label: "Collection Framework" },
  "exception-handling": { href: "/learning/java-tutorial/exception", label: "Exception" },
  multithreading: { href: "/learning/java-tutorial/thread", label: "Thread" },
  "java-8-plus": { href: "/learning/java-tutorial/lambda-expressions", label: "Lambda Expressions" },
  interfaces: { href: "/learning/java-tutorial/interface", label: "Interface" },
  "abstract-classes": { href: "/learning/java-tutorial/abstract-class", label: "Abstract Class" },
  generics: { href: "/learning/java-tutorial/generics", label: "Generics" },
  jvm: { href: "/learning/java-tutorial/jvm-architecture", label: "JVM Architecture" },
  jdbc: { href: "/learning/java-tutorial/jdbc", label: "JDBC" },
  "sql-and-java": { href: "/learning/dbms-sql-tutorial", label: "DBMS & SQL Tutorial" },
  spring: { href: "/learning/java-tutorial", label: "Java Tutorials" },
  "spring-boot": { href: "/learning/java-tutorial", label: "Java Tutorials" },
  "jpa-hibernate": { href: "/learning/java-tutorial", label: "Java Tutorials" },
  "rest-api": { href: "/learning/java-tutorial", label: "Java Tutorials" },
  "advanced-java": { href: "/learning/java-tutorial/wrapper-classes", label: "Wrapper Classes" },
  "scenario-based-questions": { href: "/learning/java-tutorial", label: "Java Tutorials" },
};
