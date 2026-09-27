/**
 * Meta descriptions — pure, unit-tested (tests/lib/metaDescription.test.ts,
 * tests/lib/seoDescriptions.test.ts). `lessonMetaDescription` is the original
 * short_description-or-opening-prose rule; the builders further down compose
 * unique, summary-style 140–155 character descriptions from real page data
 * (headings, counts, difficulty, course) for lessons, problems, interview
 * topics and courses.
 */
import { stripMarkdown } from "@/lib/blogText";

export const META_DESCRIPTION_MAX = 155;

/** `text` in at most `max` characters, cut at a word boundary with "…" when shortened. */
export function clampAtWord(text: string, max = META_DESCRIPTION_MAX): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  // A single very long word is cut mid-word rather than dropped.
  const head = space > max * 0.6 ? cut.slice(0, space) : cut;
  return `${head.replace(/[\s,;:.–—-]+$/, "")}…`;
}

/** The opening prose of a Markdown body, as plain text (at least `max` characters of it when available). */
export function leadingProse(markdown: string, max = META_DESCRIPTION_MAX): string {
  const parts: string[] = [];
  let length = 0;
  let inFence = false;
  for (const line of String(markdown || "").replace(/\r\n/g, "\n").split("\n")) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence || /^\s*(#{1,6}\s|\||(-{3,}|\*{3,}|_{3,})\s*$|!\[)/.test(line)) continue;
    const text = stripMarkdown(line);
    if (!text) continue;
    parts.push(text);
    length += text.length + 1;
    if (length > max) break;
  }
  return parts.join(" ");
}

/** A lesson's meta description: `short_description`, else the body's opening prose, else `fallback`. */
export function lessonMetaDescription(shortDescription: string | null | undefined, bodies: string[], fallback: string): string {
  const summary = (shortDescription ?? "").trim();
  if (summary) return clampAtWord(summary);
  for (const body of bodies) {
    const prose = leadingProse(body);
    if (prose) return clampAtWord(prose);
  }
  return clampAtWord(fallback);
}

// ---------------------------------------------------------------------------
// Summary-style descriptions (140–155 chars) composed from real page data.
// ---------------------------------------------------------------------------

export const META_DESCRIPTION_MIN = 140;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  copy: "©",
  reg: "®",
  trade: "™",
  times: "×",
  rarr: "→",
  larr: "←",
};

/** Decodes HTML entities (named subset above, decimal `&#39;` and hex `&#x27;`) in one pass. */
export function decodeEntities(text: string): string {
  return String(text ?? "").replace(/&(#x[0-9a-f]{1,6}|#\d{1,7}|[a-z]{2,8});/gi, (whole, ref: string) => {
    if (ref[0] === "#") {
      const code = ref[1] === "x" || ref[1] === "X" ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return whole;
      return code === 0xa0 ? " " : String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[ref.toLowerCase()] ?? whole;
  });
}

/** Plain, single-line text: Markdown stripped, entities decoded, whitespace collapsed. */
export function cleanText(text: string | null | undefined): string {
  return decodeEntities(stripMarkdown(String(text ?? "")))
    .replace(/\s+/g, " ")
    .trim();
}

/** A name/title (no Markdown to strip): entities decoded, whitespace collapsed. */
function plain(text: string | null | undefined): string {
  return decodeEntities(String(text ?? ""))
    .replace(/\s+/g, " ")
    .trim();
}

function sentence(text: string): string {
  const t = text.trim();
  if (!t) return "";
  return /[.!?…]$/.test(t) ? t : `${t}.`;
}

/**
 * Joins `parts` (each cleaned, each ended as a sentence) into at most `max`
 * characters. Whole parts are added while they fit; when the text is still
 * shorter than `min`, the first part that does not fit is cut at a word
 * boundary to fill the remaining room. Best effort on `min` — nothing is
 * padded with made-up words when the real data runs out.
 */
export function fitDescription(
  parts: (string | null | undefined)[],
  { min = META_DESCRIPTION_MIN, max = META_DESCRIPTION_MAX }: { min?: number; max?: number } = {},
): string {
  let out = "";
  for (const raw of parts) {
    const part = sentence(decodeEntities(String(raw ?? "")).replace(/\s+/g, " "));
    if (!part) continue;
    const next = out ? `${out} ${part}` : part;
    if (next.length <= max) {
      out = next;
      if (out.length >= min) break;
      continue;
    }
    // A short fixed sentence is all-or-nothing: skip it and try the next part.
    if (out && part.length <= 60) continue;
    if (out.length < min) {
      const filled = clampAtWord(next, max);
      // Only take the partial part when it adds real words (not just "A relation is in…").
      if (filled.length - out.length > 20 || !out) out = filled;
    }
    break;
  }
  return out;
}

const GENERIC_SUMMARY = /^(complete|full|detailed|short|quick|basic)?\s*(learning|study|lecture|revision)?\s*notes?\.?$/i;

/**
 * Whether an authored `short_description` is a real, specific summary worth
 * using as the meta description — not boilerplate like "Complete learning
 * notes", not a stub, not the topic title again, and not shared verbatim with
 * a sibling lesson (`duplicateCount` = how many lessons in the course carry
 * the exact same text, this one included).
 */
export function isRealSummary(summary: string, opts: { title?: string; duplicateCount?: number } = {}): boolean {
  const s = cleanText(summary);
  if (s.length < 50) return false;
  if (s.split(" ").length < 8) return false;
  if (GENERIC_SUMMARY.test(s)) return false;
  if (opts.title && s.toLowerCase() === plain(opts.title).toLowerCase()) return false;
  if ((opts.duplicateCount ?? 1) > 1) return false;
  return true;
}

/** Headings that say nothing about the specific topic. */
const GENERIC_HEADING =
  /^(introduction|intro|overview|definition|summary|conclusion|related topics?|prerequisites?|quick revision|revision|references?|further reading|next steps?|table of contents|contents|practice( questions| problems| exercises)?|exercises?|detailed explanation|explanation|notes?|faqs?|frequently asked questions|recap|what'?s next|what you('ll| will) learn|learning objectives?|resources?|output)$/i;

/** Words that keep their capital letter when a heading is lower-cased mid-sentence. */
const PROPER_WORDS = new Set(
  "Java Python Spring Boot SQL DBMS JVM JDK JRE JDBC JPA API APIs REST HTTP JSON XML HTML CSS JavaScript TypeScript Git GitHub Docker Kubernetes Linux Windows Maven Gradle Hibernate Kafka Redis MySQL PostgreSQL Oracle MongoDB Google AI ML NLP LLM LLMs RAG GPT CNN RNN NumPy Pandas Matplotlib Scikit-learn TensorFlow PyTorch Keras Excel Tomcat Lombok Thymeleaf JUnit Mockito OAuth JWT CRUD OOP OOPs"
    .split(" "),
);

function sentenceCaseHeading(heading: string, keep: Set<string>): string {
  return heading
    .split(" ")
    .map((w) => {
      const bare = w.replace(/[^A-Za-z-]/g, "");
      if (PROPER_WORDS.has(bare) || keep.has(bare)) return w;
      // Only simple Title-case words are lowered; "2NF", "ACID", "iPhone", "@Async" keep their form.
      return /^[A-Z][a-z]+(?:-[A-Za-z][a-z]*)*$/.test(bare) ? w.toLowerCase() : w;
    })
    .join(" ");
}

/**
 * Up to `limit` distinct, specific section headings of a lesson, in reading
 * order, ready to list mid-sentence: numbering and Markdown stripped, anything
 * after " — " / ":" / " / " dropped, questions and generic headings
 * ("Introduction", "Why is it used?") and "…Example…" headings (the sentence
 * already says "with examples") skipped.
 */
export function lessonHeadings(
  blocks: { heading?: string | null; body?: string | null; content_format?: string | null }[],
  { topicTitle = "", limit = 4, keepWords = [] as string[] } = {},
): string[] {
  const raw: string[] = [];
  for (const b of blocks) {
    if (b.heading) raw.push(b.heading);
    if (b.content_format === "plain") continue;
    let inFence = false;
    for (const line of String(b.body ?? "").replace(/\r\n/g, "\n").split("\n")) {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        continue;
      }
      if (inFence) continue;
      const m = line.match(/^#{2,3}\s+(.+?)\s*#*\s*$/);
      if (m) raw.push(m[1]);
    }
  }
  const keep = new Set(
    [topicTitle, ...keepWords]
      .join(" ")
      .split(/\s+/)
      .map((w) => w.replace(/[^A-Za-z-]/g, ""))
      .filter((w) => /^[A-Z]/.test(w)),
  );
  const seen = new Set<string>();
  const out: string[] = [];
  const titleKey = plain(topicTitle).toLowerCase();
  for (const h of raw) {
    let text = cleanText(h);
    if (!text || /\?\s*$/.test(text)) continue;
    text = text
      .replace(/^(?:step|part|chapter|section)?\s*\d+(?:\.\d+)*[.):]?\s+/i, "")
      .split(/\s+[—–]\s+|\s+-\s+|\s*:\s+|\s+\/\s+/)[0]
      .replace(/[\s.,;:!]+$/, "")
      .trim();
    if (!text || text.length > 40 || GENERIC_HEADING.test(text) || /\bexamples?\b/i.test(text)) continue;
    const key = text.toLowerCase();
    if (key === titleKey || seen.has(key)) continue;
    seen.add(key);
    out.push(sentenceCaseHeading(text, keep));
    if (out.length >= limit) break;
  }
  return out;
}

/** "a", "a and b", "a, b and c". */
export function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  // Serial comma when an item has its own "and" ("edge cases and pitfalls, and key takeaways").
  const last = items.length > 2 && items.some((i) => / and /.test(i)) ? ", and " : " and ";
  return `${items.slice(0, -1).join(", ")}${last}${items[items.length - 1]}`;
}

/** The first sentence (or two, while short) of a Markdown body's opening prose. */
export function openingSentences(bodies: string[], max = META_DESCRIPTION_MAX): string {
  for (const body of bodies) {
    const prose = decodeEntities(leadingProse(body, max * 2)).replace(/\s+/g, " ").trim();
    if (!prose) continue;
    // Split only at ". " / "! " / "? " so "0.5" or "e.g" never ends a sentence.
    const sentences = prose.replace(/([.!?])\s+/g, "$1\n").split("\n");
    let out = "";
    for (const s of sentences) {
      const next = `${out} ${s.trim()}`.trim();
      if (out && next.length > max) break;
      out = next;
      if (out.length >= 80) break;
    }
    return out;
  }
  return "";
}

export interface LessonDescriptionInput {
  topicTitle: string;
  /** The topic's authored `short_description`. */
  shortDescription?: string | null;
  /** How many lessons in the same course share this exact short_description (1 = unique). */
  shortDescriptionDuplicates?: number;
  /** "Java", "SQL", … or null when the topic title already names it (see `courseLanguage`). */
  language: string | null;
  courseName: string;
  sectionName?: string | null;
  /** Rendered content blocks — empty for a locked premium lesson. */
  blocks: { heading?: string | null; body?: string | null; content_format?: string | null }[];
  isPremium?: boolean;
}

/**
 * A lesson's meta description, 140–155 characters where the data allows.
 * A real authored summary wins (topped up with the course it belongs to);
 * otherwise the description is composed from the topic, the course language,
 * the lesson's own section headings and its course/chapter, then topped up
 * with the lesson's opening sentence.
 */
export function lessonDescription(input: LessonDescriptionInput): string {
  const topic = plain(input.topicTitle);
  const course = plain(input.courseName);
  const section = plain(input.sectionName);
  const summary = cleanText(input.shortDescription);
  const partOf = `Part of the ${course} course on CampusEduX.`;
  // A catch-all section ("All Topics" — the flat AI/ML Notes grid) says nothing.
  const partOfSection =
    section && section.toLowerCase() !== course.toLowerCase() && !/^(all topics|topics|general|misc(ellaneous)?|other)$/i.test(section)
      ? `Part of the ${course} course on CampusEduX — ${section}.`
      : partOf;
  const bodies = input.blocks.filter((b) => b.content_format !== "plain").map((b) => String(b.body ?? ""));
  const opening = openingSentences(bodies);
  const premium = input.isPremium ? "Premium lesson." : "";

  if (isRealSummary(summary, { title: topic, duplicateCount: input.shortDescriptionDuplicates })) {
    return fitDescription([summary, partOf, `${course} on CampusEduX.`]);
  }

  const subject = input.language ? `${topic} in ${input.language}` : topic;
  const headings = lessonHeadings(input.blocks, {
    topicTitle: topic,
    keepWords: [course, input.language ?? ""],
  });
  const lead = (n: number) =>
    n > 0 ? `Learn ${subject} with examples: ${joinList(headings.slice(0, n))}.` : `Learn ${subject} with clear explanations and examples.`;

  const tails = Array.from(new Set([partOfSection, partOf, `${course} on CampusEduX.`]));
  // Most headings first; the first lead + course line landing in 140–155 wins.
  // Otherwise the longest one that fits is topped up with the opening sentence.
  let best = "";
  for (let n = headings.length; n >= 0; n -= 1) {
    for (const tail of tails) {
      const candidate = `${lead(n)} ${tail}`;
      if (candidate.length > META_DESCRIPTION_MAX) continue;
      if (candidate.length >= META_DESCRIPTION_MIN) return fitDescription([candidate, premium]);
      if (candidate.length > best.length) best = candidate;
    }
  }
  return fitDescription([best || `${lead(0)} ${partOf}`, opening, premium]);
}

function withArticle(word: string): string {
  return /^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`;
}

/**
 * A coding problem's meta description: what it is (difficulty, language,
 * topic) then its real statement — or, for a locked premium problem whose
 * statement is withheld, only what the premium gate actually shows.
 */
export function problemDescription(input: {
  title: string;
  difficulty?: string | null;
  /** "Java", "SQL", "Coding", … */
  language: string;
  /** Learning topic title or practice category name. */
  topicName?: string | null;
  statement?: string | null;
  locked: boolean;
}): string {
  const title = plain(input.title);
  const difficulty = plain(input.difficulty);
  const lang = input.language && input.language !== "Coding" ? `${input.language} ` : "coding ";
  const topic = plain(input.topicName);
  const kind = `${difficulty ? `${difficulty} ` : ""}${lang}practice problem`;
  const lead = `${title} is ${withArticle(kind)}${topic ? ` on ${topic}` : ""}.`;
  if (input.locked) {
    return fitDescription([
      lead,
      "It's a Premium problem — unlock it on CampusEduX to view the full statement, examples and code editor.",
    ]);
  }
  const statement = openingSentences([String(input.statement ?? "")], META_DESCRIPTION_MAX * 2);
  return fitDescription([lead, statement, "Write, run and submit your solution in the CampusEduX online code editor."]);
}

/** An interview-questions topic page: count + topic, what each answer holds, then the topic's own blurb. */
export function interviewTopicDescription(input: {
  categoryName: string;
  topicName: string;
  topicDescription?: string | null;
  questions: { example?: string | null; important_point?: string | null }[];
}): string {
  const cat = plain(input.categoryName);
  const topic = plain(input.topicName);
  const n = input.questions.length;
  const subject = cat && !topic.toLowerCase().includes(cat.toLowerCase()) ? `${cat} ${topic}` : topic;
  const extras = [
    input.questions.some((q) => (q.example ?? "").trim()) ? "code examples" : "",
    input.questions.some((q) => (q.important_point ?? "").trim()) ? "key points to remember" : "",
  ].filter(Boolean);
  const lead =
    n > 0
      ? `${n} ${subject} interview question${n === 1 ? "" : "s"} with clear answers${extras.length ? `, ${joinList(extras)}` : ""}.`
      : `${subject} interview questions and answers.`;
  return fitDescription([lead, cleanText(input.topicDescription), `Prepare for ${cat || topic} interviews on CampusEduX.`]);
}

/** An interview-questions category page: topic/question counts, first topics, then the category's blurb. */
export function interviewCategoryDescription(input: {
  categoryName: string;
  categoryDescription?: string | null;
  topics: { name: string; question_count?: number | null }[];
}): string {
  const cat = plain(input.categoryName);
  const total = input.topics.reduce((sum, t) => sum + (t.question_count ?? 0), 0);
  const names = input.topics.slice(0, 3).map((t) => plain(t.name)).filter(Boolean);
  const lead =
    input.topics.length > 0
      ? `${cat} interview questions and answers across ${input.topics.length} topic${input.topics.length === 1 ? "" : "s"}${
          total > 0 ? ` (${total} questions)` : ""
        }${names.length ? `, including ${joinList(names)}` : ""}.`
      : `${cat} interview questions and answers, organized by topic.`;
  return fitDescription([lead, cleanText(input.categoryDescription), "Prepare for technical interviews on CampusEduX."]);
}

/** A course (Learning grid) overview: its authored description, then its real size. */
export function courseDescription(input: {
  courseName: string;
  description?: string | null;
  lessonCount: number;
  chapterCount: number;
}): string {
  const name = plain(input.courseName);
  const size =
    input.lessonCount > 0
      ? `${input.lessonCount} lesson${input.lessonCount === 1 ? "" : "s"}${
          input.chapterCount > 1 ? ` across ${input.chapterCount} chapters` : ""
        } with examples, on CampusEduX.`
      : "";
  const desc = cleanText(input.description);
  return fitDescription(desc ? [desc, `${name}: ${size}`] : [`${name} on CampusEduX.`, size]);
}

/** An authored description (blog excerpt, job/project text): cleaned and cut to 155 at a word boundary. */
export function authoredDescription(text: string | null | undefined, fallback = ""): string {
  const t = cleanText(text) || cleanText(fallback);
  return clampAtWord(t);
}
