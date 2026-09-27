/**
 * Pure helpers for the "explore more" discovery block at the bottom of a
 * Learning topic page (Other Tutorials / Related Projects / Related Jobs /
 * Latest Jobs / Other Learning Topics). No React / next / supabase imports —
 * unit-testable in plain Node, mirrors `src/lib/searchModel.ts`.
 *
 * The learning catalog has no per-grid "technology" column, so the tech a topic
 * belongs to is DERIVED from its grid slug/name and normalised to the exact
 * search terms already matched against `projects.tech_stack` / `jobs.skills`
 * (see `arrayMatchVariants` in `searchModel.ts`). Nothing here builds a URL —
 * the caller links every result to its real, existing detail route.
 */

import type { LearningTree, LearningTreeTopic } from "@/lib/learning.types";

export interface GridTechProfile {
  /** Human label for headings + anchor text ("Java", "C++", "AI/ML"). */
  label: string;
  /** Exact-element match terms for `projects.tech_stack` / `jobs.skills`. */
  terms: string[];
}

/** Course-type suffix an admin / seed appends to a grid slug or name. */
const SLUG_SUFFIX = /-(tutorials?|notes?|course|guide|programming|lang|language|basics)$/i;
const NAME_SUFFIX = /\s+(tutorials?|notes?|course|guide|programming)$/i;

/**
 * De-suffixed slug key → profile. This table only *adds synonyms* for better
 * recall (js → javascript, ai-ml → machine learning); it is NOT a gate. A grid
 * that isn't listed still resolves to its de-suffixed slug as the search term,
 * so a future "Rust Tutorial" works with no code change.
 */
const SYNONYMS: Record<string, GridTechProfile> = {
  java: { label: "Java", terms: ["Java"] },
  python: { label: "Python", terms: ["Python"] },
  c: { label: "C", terms: ["C"] },
  cpp: { label: "C++", terms: ["C++", "CPP"] },
  "c-plus-plus": { label: "C++", terms: ["C++", "CPP"] },
  csharp: { label: "C#", terms: ["C#", "CSharp", ".NET"] },
  "c-sharp": { label: "C#", terms: ["C#", "CSharp", ".NET"] },
  go: { label: "Go", terms: ["Go", "Golang"] },
  golang: { label: "Go", terms: ["Go", "Golang"] },
  rust: { label: "Rust", terms: ["Rust"] },
  php: { label: "PHP", terms: ["PHP", "Laravel"] },
  ruby: { label: "Ruby", terms: ["Ruby", "Rails"] },
  kotlin: { label: "Kotlin", terms: ["Kotlin", "Android"] },
  swift: { label: "Swift", terms: ["Swift", "iOS"] },
  javascript: { label: "JavaScript", terms: ["JavaScript", "JS", "Node.js"] },
  js: { label: "JavaScript", terms: ["JavaScript", "JS", "Node.js"] },
  typescript: { label: "TypeScript", terms: ["TypeScript", "TS", "JavaScript"] },
  ts: { label: "TypeScript", terms: ["TypeScript", "TS", "JavaScript"] },
  react: { label: "React", terms: ["React", "React.js", "JavaScript"] },
  angular: { label: "Angular", terms: ["Angular", "TypeScript"] },
  vue: { label: "Vue", terms: ["Vue", "Vue.js", "JavaScript"] },
  node: { label: "Node.js", terms: ["Node.js", "Node", "Express", "JavaScript"] },
  "node-js": { label: "Node.js", terms: ["Node.js", "Node", "Express", "JavaScript"] },
  html: { label: "Web Development", terms: ["HTML", "CSS", "JavaScript"] },
  css: { label: "Web Development", terms: ["CSS", "HTML", "JavaScript"] },
  "web-development": { label: "Web Development", terms: ["Web", "HTML", "CSS", "JavaScript", "React"] },
  "web-dev": { label: "Web Development", terms: ["Web", "HTML", "CSS", "JavaScript", "React"] },
  frontend: { label: "Frontend", terms: ["Frontend", "HTML", "CSS", "JavaScript", "React"] },
  backend: { label: "Backend", terms: ["Backend", "Node.js", "API", "SQL"] },
  sql: { label: "SQL", terms: ["SQL", "MySQL", "PostgreSQL", "Database"] },
  mysql: { label: "SQL", terms: ["MySQL", "SQL", "Database"] },
  dbms: { label: "SQL", terms: ["SQL", "DBMS", "Database"] },
  mongodb: { label: "MongoDB", terms: ["MongoDB", "NoSQL", "Database"] },
  "ai-ml": { label: "AI/ML", terms: ["AI", "ML", "Machine Learning", "Python", "TensorFlow"] },
  aiml: { label: "AI/ML", terms: ["AI", "ML", "Machine Learning", "Python", "TensorFlow"] },
  ai: { label: "AI/ML", terms: ["AI", "ML", "Machine Learning", "Python"] },
  "machine-learning": { label: "Machine Learning", terms: ["Machine Learning", "ML", "AI", "Python"] },
  ml: { label: "Machine Learning", terms: ["Machine Learning", "ML", "AI", "Python"] },
  "deep-learning": { label: "Deep Learning", terms: ["Deep Learning", "Machine Learning", "Python", "TensorFlow"] },
  "data-science": { label: "Data Science", terms: ["Data Science", "Python", "Pandas", "Machine Learning"] },
  "data-analytics": { label: "Data Analytics", terms: ["Data Analytics", "SQL", "Python", "Power BI"] },
  dsa: { label: "DSA", terms: ["DSA", "Data Structures", "Algorithms"] },
  "data-structures": { label: "DSA", terms: ["DSA", "Data Structures", "Algorithms"] },
  "data-structures-and-algorithms": { label: "DSA", terms: ["DSA", "Data Structures", "Algorithms"] },
  algorithms: { label: "DSA", terms: ["Algorithms", "Data Structures", "DSA"] },
};

function titleCase(s: string): string {
  return s
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Resolve a learning grid to the technology label + array-match terms used to
 * find related projects / jobs. Prefers the slug; falls back to the name; and
 * finally to a title-cased form of whichever it has, so it never returns empty.
 */
export function gridTechProfile(gridSlug: string, gridName?: string | null): GridTechProfile {
  const slugKey = (gridSlug || "").toLowerCase().trim().replace(SLUG_SUFFIX, "").trim();
  if (slugKey && SYNONYMS[slugKey]) return SYNONYMS[slugKey];

  const nameKey = (gridName || "").toLowerCase().trim().replace(NAME_SUFFIX, "").trim().replace(/\s+/g, "-");
  if (nameKey && SYNONYMS[nameKey]) return SYNONYMS[nameKey];

  const label = titleCase(slugKey || nameKey || gridName || gridSlug || "");
  const terms = Array.from(
    new Set([label, slugKey].filter((t): t is string => Boolean(t) && t.length >= 2)),
  );
  return { label: label || "Programming", terms: terms.length ? terms : ["Programming"] };
}

/**
 * Rank other grids for the "Other Tutorials" strip: featured first, then the
 * ones with the most published topics (a popularity proxy), then the admin's
 * own sort order, then name for a stable finish.
 */
export function rankTutorials<
  T extends { name?: string; is_featured?: boolean; topic_count?: number; sort_order?: number },
>(grids: T[]): T[] {
  return [...grids].sort(
    (a, b) =>
      Number(b.is_featured ?? false) - Number(a.is_featured ?? false) ||
      (b.topic_count ?? 0) - (a.topic_count ?? 0) ||
      (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
      (a.name ?? "").localeCompare(b.name ?? ""),
  );
}

/** Merge `extra` into `base` keyed by `id`, no duplicates, capped at `limit`. */
export function mergeUniqueById<T extends { id: string }>(base: T[], extra: T[], limit: number): T[] {
  const seen = new Set(base.map((x) => x.id));
  const out = [...base];
  for (const item of extra) {
    if (out.length >= limit) break;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Internal linking — "Related lessons" (lesson page) + "Popular topics"
// (/learning). Both are pure selections over `LearningTree` data the caller
// already fetched with `getLearningTree` (cached, tag-invalidated), so they
// add no per-request query. Every result is a real, published, website-visible
// topic straight out of the tree RPC — nothing here invents a slug.
// ---------------------------------------------------------------------------

/**
 * Grids whose lessons are (almost all) deliberately `noindex` — see
 * `isTemplatedGenerativeAiBody` in `src/lib/contentQuality.ts`: 206 of the 207
 * Generative AI topics are mail-merge template bodies. The tree carries no
 * body text, so the exclusion is by grid: new link blocks never promote these
 * lessons (the course page + sidebar still list them for readers).
 */
export const THIN_TEMPLATE_GRID_SLUGS: ReadonlySet<string> = new Set(["generative-ai"]);

export function isThinTemplateGrid(gridSlug: string): boolean {
  return THIN_TEMPLATE_GRID_SLUGS.has((gridSlug || "").toLowerCase());
}

export interface LessonLink {
  gridSlug: string;
  gridName: string;
  topicSlug: string;
  title: string;
  sectionName: string;
}

/** Words that carry no topical meaning in a lesson title / slug. The grid's own
 *  name words ("java", "sql", "spring", "boot"…) are added per grid. */
const TITLE_STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "basic", "basics", "by", "concept", "concepts", "data", "database", "for",
  "from", "how",
  "in", "into", "intro", "introduction", "is", "it", "of", "on", "or", "program", "programs", "question",
  "questions", "the", "to", "tutorial", "tutorials", "types", "using", "vs", "what", "with", "your", "notes",
]);

/** Lowercased meaningful tokens of a title + slug, lightly singularised. */
export function lessonTokens(text: string, extraStop: ReadonlySet<string> = new Set()): Set<string> {
  const out = new Set<string>();
  for (const raw of (text || "").toLowerCase().split(/[^a-z0-9+#]+/)) {
    if (!raw || TITLE_STOPWORDS.has(raw) || extraStop.has(raw)) continue;
    // "arrays" -> "array", "classes" -> "class"; keep short words ("js", "is") intact.
    const t = raw.length > 4 && raw.endsWith("es") && /(ss|x|ch|sh)es$/.test(raw)
      ? raw.slice(0, -2)
      : raw.length > 3 && raw.endsWith("s") && !raw.endsWith("ss")
        ? raw.slice(0, -1)
        : raw;
    if (t.length < 2 || TITLE_STOPWORDS.has(t) || extraStop.has(t)) continue;
    out.add(t);
  }
  return out;
}

/** Tokens overlap when equal, or when a long token contains another long one
 *  ("hashmap" ⊂ "linkedhashmap") — never for short fragments. */
function tokensShared(a: Set<string>, b: Set<string>): number {
  let n = 0;
  a.forEach((x) => {
    for (const y of Array.from(b)) {
      if (x === y || (x.length >= 5 && y.length >= 5 && (x.includes(y) || y.includes(x)))) {
        n += 1;
        break;
      }
    }
  });
  return n;
}

export interface RelatedLessonOptions {
  /** Max lessons returned (default 5). */
  limit?: number;
  /** Slugs to leave out (e.g. prev/next, already linked by the lesson nav). */
  exclude?: string[];
}

/**
 * Pick up to `limit` genuinely related lessons for one lesson, from its own
 * course tree. Score = 4 × shared title/slug keywords + 2 for the same section
 * + 1 when within two lessons in reading order (so one shared keyword always
 * outranks mere proximity). Only candidates with a keyword
 * match or the same section qualify (so a lesson never gets a random link);
 * ties break by reading-order distance, then reading order. Premium lessons
 * are skipped (locked body), as is every lesson of a thin-template grid.
 * Cross-course links are intentionally not produced — only one course tree is
 * in hand on a lesson page, and a same-course link is always on-topic.
 */
export function selectRelatedLessons(
  tree: LearningTree | null,
  currentTopicSlug: string,
  opts: RelatedLessonOptions = {},
): LessonLink[] {
  if (!tree || isThinTemplateGrid(tree.grid.slug)) return [];
  const limit = opts.limit ?? 5;
  const exclude = new Set((opts.exclude ?? []).filter(Boolean));

  const flat = tree.sections.flatMap((section) => section.topics.map((topic) => ({ section, topic })));
  const idx = flat.findIndex((f) => f.topic.slug === currentTopicSlug);
  if (idx < 0) return [];
  const current = flat[idx];

  const gridStop = lessonTokens(`${tree.grid.name} ${tree.grid.slug}`);
  const tokensOf = (t: LearningTreeTopic) => lessonTokens(`${t.title} ${t.slug.replace(/-/g, " ")}`, gridStop);
  const mine = tokensOf(current.topic);

  const scored: { f: (typeof flat)[number]; score: number; dist: number; order: number }[] = [];
  flat.forEach((f, order) => {
    if (order === idx || f.topic.is_premium || exclude.has(f.topic.slug) || f.topic.slug === current.topic.slug) return;
    const shared = tokensShared(mine, tokensOf(f.topic));
    const sameSection = f.section.id === current.section.id;
    if (shared === 0 && !sameSection) return;
    const dist = Math.abs(order - idx);
    scored.push({ f, score: shared * 4 + (sameSection ? 2 : 0) + (dist <= 2 ? 1 : 0), dist, order });
  });

  scored.sort((a, b) => b.score - a.score || a.dist - b.dist || a.order - b.order);
  const seen = new Set<string>();
  const out: LessonLink[] = [];
  for (const { f } of scored) {
    if (out.length >= limit) break;
    if (seen.has(f.topic.slug)) continue;
    seen.add(f.topic.slug);
    out.push({
      gridSlug: tree.grid.slug,
      gridName: tree.grid.name,
      topicSlug: f.topic.slug,
      title: f.topic.title,
      sectionName: f.section.name,
    });
  }
  return out;
}

/**
 * Editorial "Popular topics" picks for /learning. There is no anon-readable
 * popularity signal in the schema (no view / visit counters; lesson progress is
 * device-only; `learning_bookmarks` is owner-only RLS), so this is a fixed,
 * documented editorial list: foundational, high-search-intent lessons across
 * the courses, interleaved by course so no single course dominates. Each pick
 * is resolved against the live tree at render time and silently dropped if it
 * no longer exists, is premium, or its course is premium / thin-template — the
 * trailing entries are reserves that keep the block at 20 when that happens.
 * Every pick was checked live (HTTP 200, indexable, free) on 2026-09-27.
 */
export const POPULAR_LESSON_PICKS: readonly { gridSlug: string; topicSlug: string }[] = [
  { gridSlug: "java-tutorial", topicSlug: "introduction-to-java" },
  { gridSlug: "dbms-sql-tutorial", topicSlug: "sql-overview" },
  { gridSlug: "spring-boot-tutorial", topicSlug: "what-is-spring-boot" },
  { gridSlug: "python-tutorial", topicSlug: "python-fundamentals" },
  { gridSlug: "ai-ml-notes", topicSlug: "what-is-machine-learning" },
  { gridSlug: "java-tutorial", topicSlug: "inheritance" },
  { gridSlug: "dbms-sql-tutorial", topicSlug: "inner-join" },
  { gridSlug: "spring-boot-tutorial", topicSlug: "dependency-injection" },
  { gridSlug: "python-tutorial", topicSlug: "oop" },
  { gridSlug: "ai-ml-notes", topicSlug: "linear-regression" },
  { gridSlug: "java-tutorial", topicSlug: "polymorphism" },
  { gridSlug: "dbms-sql-tutorial", topicSlug: "group-by" },
  { gridSlug: "spring-boot-tutorial", topicSlug: "building-a-complete-crud-rest-api" },
  { gridSlug: "python-tutorial", topicSlug: "python-data-structures" },
  { gridSlug: "ai-ml-notes", topicSlug: "neural-networks" },
  { gridSlug: "java-tutorial", topicSlug: "collection-framework" },
  { gridSlug: "dbms-sql-tutorial", topicSlug: "primary-key" },
  { gridSlug: "spring-boot-tutorial", topicSlug: "jwt-authentication" },
  { gridSlug: "java-tutorial", topicSlug: "hashmap" },
  { gridSlug: "dbms-sql-tutorial", topicSlug: "3nf" },
  // Reserves — used only when an entry above stops resolving.
  { gridSlug: "java-tutorial", topicSlug: "exception" },
  { gridSlug: "dbms-sql-tutorial", topicSlug: "acid" },
  { gridSlug: "python-tutorial", topicSlug: "functions" },
  { gridSlug: "ai-ml-notes", topicSlug: "supervised-learning" },
  { gridSlug: "java-tutorial", topicSlug: "stream-api" },
];

export const POPULAR_LESSON_LIMIT = 20;

/** Distinct grid slugs referenced by the picks — the only trees worth fetching. */
export function popularPickGridSlugs(
  picks: readonly { gridSlug: string }[] = POPULAR_LESSON_PICKS,
): string[] {
  return Array.from(new Set(picks.map((p) => p.gridSlug.toLowerCase())));
}

/**
 * Resolve editorial picks against real trees. `trees` are the already-fetched
 * course trees (null = unavailable); `premiumGridSlugs` are courses whose grid
 * is premium (from `learning_grids_list`). Returns at most `limit` lessons in
 * pick order, never a duplicate, never a lesson missing from its tree.
 */
export function selectPopularLessons(
  trees: (LearningTree | null)[],
  opts: {
    picks?: readonly { gridSlug: string; topicSlug: string }[];
    premiumGridSlugs?: Iterable<string>;
    limit?: number;
  } = {},
): LessonLink[] {
  const picks = opts.picks ?? POPULAR_LESSON_PICKS;
  const limit = opts.limit ?? POPULAR_LESSON_LIMIT;
  const premiumGrids = new Set(Array.from(opts.premiumGridSlugs ?? [], (s) => s.toLowerCase()));

  const byGrid = new Map<string, LearningTree>();
  for (const t of trees) if (t?.grid?.slug) byGrid.set(t.grid.slug.toLowerCase(), t);

  const out: LessonLink[] = [];
  const seen = new Set<string>();
  for (const pick of picks) {
    if (out.length >= limit) break;
    const gKey = pick.gridSlug.toLowerCase();
    if (premiumGrids.has(gKey) || isThinTemplateGrid(gKey)) continue;
    const tree = byGrid.get(gKey);
    if (!tree) continue;
    const key = `${gKey}/${pick.topicSlug.toLowerCase()}`;
    if (seen.has(key)) continue;
    for (const section of tree.sections) {
      const topic = section.topics.find((t) => t.slug.toLowerCase() === pick.topicSlug.toLowerCase());
      if (!topic) continue;
      if (!topic.is_premium) {
        seen.add(key);
        out.push({
          gridSlug: tree.grid.slug,
          gridName: tree.grid.name,
          topicSlug: topic.slug,
          title: topic.title,
          sectionName: section.name,
        });
      }
      break;
    }
  }
  return out;
}
