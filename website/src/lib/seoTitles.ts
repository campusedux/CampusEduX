/**
 * Search-result titles — pure and unit-tested (tests/lib/seoTitles.test.ts).
 *
 * Every builder returns the COMPLETE `<title>` including the " | CampusEduX"
 * suffix, and pages pass it as `title: { absolute }` so the root layout's
 * `%s | CampusEduX` template can never double it. Each builder tries a list of
 * candidates from most to least descriptive and keeps the first that fits in
 * `TITLE_MAX` characters; when even the barest one is too long, the subject is
 * cut at a word boundary. Nothing here invents data — every word comes from
 * the page's own row (topic / problem / course names) or a fixed label.
 */
import { BRAND } from "@/lib/brand";
import { decodeEntities } from "@/lib/metaDescription";

export const TITLE_MAX = 60;
export const TITLE_SUFFIX = ` | ${BRAND.name}`;

function clean(text: string | null | undefined): string {
  return decodeEntities(String(text ?? ""))
    .replace(/\s+/g, " ")
    .trim();
}

/** Trailing joiners a word-boundary cut can leave dangling ("Environment, CLI &"). */
const DANGLING = /(?:\s*(?:[,;:&(/|–—-]|\band\b|\bor\b|\bin\b|\bof\b|\bthe\b|\bwith\b|\bto\b|\bfor\b))+$/i;

/** `text` in at most `max` characters, cut at a word boundary with "…" when shortened. */
export function truncateAtWord(text: string, max: number): string {
  const t = clean(text);
  if (t.length <= max) return t;
  const cut = t.slice(0, Math.max(1, max - 1));
  const space = cut.lastIndexOf(" ");
  const head = (space > max * 0.4 ? cut.slice(0, space) : cut).replace(DANGLING, "").trim();
  return `${head || cut.trim()}…`;
}

/**
 * The first candidate that fits in `max` characters once the brand suffix is
 * appended; otherwise `fallback(budget)` (budget = characters left for the
 * subject), which should truncate with `truncateAtWord`.
 */
export function fitTitle(candidates: string[], fallback: (budget: number) => string, max = TITLE_MAX): string {
  const budget = max - TITLE_SUFFIX.length;
  for (const candidate of candidates) {
    const c = clean(candidate);
    if (c && c.length <= budget) return `${c}${TITLE_SUFFIX}`;
  }
  return `${truncateAtWord(fallback(budget), budget)}${TITLE_SUFFIX}`;
}

// ---------------------------------------------------------------------------
// Course → language / subject
// ---------------------------------------------------------------------------

interface CourseLanguage {
  /** What the "<Topic> in <Language>" phrase names. */
  language: string;
  /** Lower-case words/phrases that already make a title language-specific. */
  aliases: string[];
}

/**
 * Explicit map of the real Learning grid slugs (verified against the seed
 * migrations and the live /learning index) to the subject a searcher types.
 * DBMS & SQL is resolved per topic by `courseLanguage` — SQL statements read
 * "in SQL", database theory reads "in DBMS".
 */
const COURSE_LANGUAGE: Record<string, CourseLanguage> = {
  "java-tutorial": { language: "Java", aliases: ["java"] },
  "python-tutorial": { language: "Python", aliases: ["python"] },
  "dbms-sql-tutorial": { language: "DBMS", aliases: ["dbms", "rdbms", "sql"] },
  "spring-boot-tutorial": { language: "Spring Boot", aliases: ["spring boot", "spring"] },
  "ai-ml-notes": {
    language: "Machine Learning",
    aliases: ["machine learning", "ml", "ai", "artificial intelligence", "deep learning"],
  },
  "generative-ai": {
    language: "Generative AI",
    aliases: ["generative ai", "genai", "gen ai", "ai", "llm", "llms"],
  },
};

/** Database-theory acronyms in DBMS topic titles — every other all-caps word there is an SQL keyword. */
const DBMS_THEORY_ACRONYMS = new Set(["DBMS", "RDBMS", "ER", "EER", "BCNF", "ACID", "DBA", "CAP", "OLTP", "OLAP"]);

function hasWordOrPhrase(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(haystack);
}

/** "Kotlin" from "Kotlin Tutorial", for grids not in the map; null for names that are not "<X> Tutorial"-style. */
function subjectFromCourseName(courseName: string): string | null {
  const name = clean(courseName);
  const subject = name.replace(/\s+(tutorials?|course|guide)$/i, "").trim();
  // "Preparation Notes" names no language — only "<X> Tutorial"-style names do.
  return subject && subject !== name ? subject : null;
}

/**
 * The language/subject a lesson of this course is "in", or `null` when the
 * topic title already says it (so "Java Basics" never becomes "Java Basics in
 * Java").
 */
export function courseLanguage(gridSlug: string, courseName: string, topicTitle: string): string | null {
  const title = clean(topicTitle);
  const known = COURSE_LANGUAGE[gridSlug];
  if (known) {
    if (known.aliases.some((a) => hasWordOrPhrase(title, a))) return null;
    if (gridSlug === "dbms-sql-tutorial") {
      const caps = title.match(/\b[A-Z]{2,}\b/g) ?? [];
      return caps.some((w) => !DBMS_THEORY_ACRONYMS.has(w)) ? "SQL" : "DBMS";
    }
    return known.language;
  }
  const subject = subjectFromCourseName(courseName);
  if (!subject || subject.toLowerCase() === title.toLowerCase() || hasWordOrPhrase(title, subject)) return null;
  return subject;
}

// ---------------------------------------------------------------------------
// Page-type title builders
// ---------------------------------------------------------------------------

/**
 * Search subjects for lessons whose own title is shared with another lesson of
 * the same course (duplicate `<title>`s in the SEO report: the relational-
 * algebra vs SQL-syntax pairs and the three "Cardinality" lessons). Keyed
 * `<gridSlug>/<topicSlug>`; each value replaces "<Topic> in <Language>" in the
 * title, description and headline. The on-page H1 keeps the authored title.
 */
const LESSON_SEO_SUBJECTS: Record<string, string> = {
  "dbms-sql-tutorial/cardinality": "Relation Cardinality in DBMS",
  "dbms-sql-tutorial/cardinality-ratio": "Cardinality Ratio in ER Model",
  "dbms-sql-tutorial/index-cardinality": "Index Cardinality in DBMS",
  "dbms-sql-tutorial/foreign-key": "Foreign Key in DBMS",
  "dbms-sql-tutorial/foreign-key-constraint-syntax": "FOREIGN KEY Constraint in SQL",
  "dbms-sql-tutorial/primary-key": "Primary Key in DBMS",
  "dbms-sql-tutorial/primary-key-constraint-syntax": "PRIMARY KEY Constraint in SQL",
  "dbms-sql-tutorial/natural-join": "Natural Join in Relational Algebra",
  "dbms-sql-tutorial/natural-join-sql": "NATURAL JOIN in SQL",
  "dbms-sql-tutorial/rename": "Rename Operation in Relational Algebra",
  "dbms-sql-tutorial/rename-statement": "RENAME Table and Column in SQL",
  "dbms-sql-tutorial/union": "Union in Relational Algebra",
  "dbms-sql-tutorial/union-sql": "UNION in SQL",
};

/** The fixed search subject for a lesson with a duplicated title, or `null`. */
export function lessonSeoSubject(gridSlug: string, topicSlug: string | null | undefined): string | null {
  return topicSlug ? LESSON_SEO_SUBJECTS[`${gridSlug}/${topicSlug}`] ?? null : null;
}

/**
 * Courses whose lesson titles rotate between suffix styles, so a 150-lesson
 * course doesn't read as one repeated pattern in search results. (Python's 30
 * lessons are broad chapters — "Git & GitHub", "Deep Learning" — where
 * "Syntax & Examples" reads wrong, so it keeps the single style.)
 */
const ROTATING_SUFFIX_COURSES = new Set(["java-tutorial"]);

type LessonSuffix = "with" | "explained" | "syntax";

/** Overview / comparison topics ("Introduction to Java", "Java vs C/C++", "JDK, JRE and JVM") have no syntax to show. */
const CONCEPTUAL_TOPIC =
  /^(introduction|intro|history|features?|overview|what|why|how|when|difference|differences|advantages|benefits|basics|types|comparison|setting up|installing|installation|jdk|jre|jvm)\b|\bvs\.?(\s|$)/i;

/** 32-bit FNV-1a — a stable, build-independent hash of the lesson slug. */
function stableHash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** The suffix styles to try for a lesson, preferred one first. */
export function lessonSuffixOrder(gridSlug: string, topicSlug: string | null | undefined, topicTitle: string): LessonSuffix[] {
  if (!topicSlug || !ROTATING_SUFFIX_COURSES.has(gridSlug)) return ["with"];
  const styles: LessonSuffix[] = CONCEPTUAL_TOPIC.test(clean(topicTitle)) ? ["with", "explained"] : ["with", "explained", "syntax"];
  const start = stableHash(topicSlug) % styles.length;
  return [...styles.slice(start), ...styles.slice(0, start)];
}

function withSuffix(subject: string, suffix: LessonSuffix): string {
  if (suffix === "explained") return `${subject} Explained with Examples`;
  if (suffix === "syntax") return `${subject}: Syntax & Examples`;
  return `${subject} (with Examples)`;
}

/**
 * "<Topic> in <Language> (with Examples) | CampusEduX", degrading to fit.
 * Java lessons rotate the suffix by slug between "(with Examples)",
 * "Explained with Examples" and ": Syntax & Examples"; when the preferred one
 * is too long, the other styles are tried before dropping the suffix.
 */
export function lessonTitle(input: {
  topicTitle: string;
  gridSlug: string;
  courseName: string;
  topicSlug?: string | null;
}): string {
  const topic = clean(input.topicTitle);
  const override = lessonSeoSubject(input.gridSlug, input.topicSlug);
  const language = override ? null : courseLanguage(input.gridSlug, input.courseName, topic);
  const subject = override ?? (language ? `${topic} in ${language}` : topic);
  const suffixed = lessonSuffixOrder(input.gridSlug, input.topicSlug, topic).map((s) => withSuffix(subject, s));
  const candidates = Array.from(new Set([...suffixed, subject, topic]));
  return fitTitle(candidates, () => topic);
}

const LANGUAGE_LABEL: Record<string, string> = {
  java: "Java",
  python: "Python",
  python3: "Python",
  c: "C",
  cpp: "C++",
  "c++": "C++",
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  sql: "SQL",
};

/** Display name for a compiler language id ("cpp" → "C++"), or `null` for an unknown id. */
export function languageLabel(id: string | null | undefined): string | null {
  const key = String(id ?? "").trim().toLowerCase();
  return LANGUAGE_LABEL[key] ?? null;
}

/**
 * The language a coding problem is practised in: its only supported language
 * when it has exactly one, else the course's language (topic problems), else
 * "Coding" (the global practice library is solvable in every language).
 */
export function problemLanguage(input: {
  supportedLanguages?: string[] | null;
  gridSlug?: string | null;
}): string {
  const langs = Array.from(new Set((input.supportedLanguages ?? []).map((l) => languageLabel(l)).filter(Boolean)));
  if (langs.length === 1) return langs[0] as string;
  const known = input.gridSlug ? COURSE_LANGUAGE[input.gridSlug] : undefined;
  if (known && input.gridSlug !== "dbms-sql-tutorial") return known.language;
  if (input.gridSlug === "dbms-sql-tutorial") return "SQL";
  return "Coding";
}

/** "<Problem> – <Language> Practice Problem | CampusEduX", degrading to fit. */
export function problemTitle(input: { problemTitle: string; language: string }): string {
  const p = clean(input.problemTitle);
  const lang = clean(input.language) || "Coding";
  const redundant = lang !== "Coding" && hasWordOrPhrase(p, lang);
  const candidates = redundant
    ? [`${p} – Practice Problem`, `${p} – Practice`, p]
    : [`${p} – ${lang} Practice Problem`, `${p} – ${lang} Problem`, `${p} – Practice`, p];
  return fitTitle(candidates, () => p);
}

/** "Java Inheritance Interview Questions & Answers | CampusEduX", degrading to fit. */
export function interviewTopicTitle(input: { categoryName: string; topicName: string }): string {
  const cat = clean(input.categoryName);
  const topic = clean(input.topicName);
  const subject = cat && !hasWordOrPhrase(topic, cat) ? `${cat} ${topic}` : topic;
  return fitTitle(
    [
      `${subject} Interview Questions & Answers`,
      `${subject} Interview Questions`,
      `${topic} Interview Questions`,
      `${topic} Interview Q&A`,
    ],
    (budget) => `${truncateAtWord(topic, budget - " Interview Q&A".length)} Interview Q&A`,
  );
}

/** "Java Interview Questions & Answers by Topic | CampusEduX", degrading to fit. */
export function interviewCategoryTitle(categoryName: string): string {
  const cat = clean(categoryName);
  return fitTitle(
    [`${cat} Interview Questions & Answers by Topic`, `${cat} Interview Questions & Answers`, `${cat} Interview Questions`],
    () => cat,
  );
}

/** "Java Tutorial – 150 Lessons with Examples | CampusEduX", degrading to fit. */
export function courseTitle(input: { courseName: string; lessonCount: number }): string {
  const name = clean(input.courseName);
  const n = Math.max(0, Math.floor(input.lessonCount || 0));
  const candidates = n > 1 ? [`${name} – ${n} Lessons with Examples`, `${name} – ${n} Lessons`, name] : [name];
  return fitTitle(candidates, () => name);
}

/** "<Job title> at <Company> | CampusEduX", degrading to fit. */
export function jobTitle(input: { title: string; company: string }): string {
  const t = clean(input.title);
  const c = clean(input.company);
  return fitTitle(c ? [`${t} at ${c}`, t] : [t], () => t);
}

/** A title authored elsewhere (blog post, project), kept verbatim when it fits. */
export function plainTitle(subject: string): string {
  const s = clean(subject);
  return fitTitle([s], () => s);
}
