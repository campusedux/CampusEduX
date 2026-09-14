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
