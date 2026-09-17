/**
 * Pure, dependency-free glossary builder for the Learning topic-page inline
 * internal-linking pass. Built entirely from a `LearningTree` the topic page
 * has already fetched (`getLearningTree`) — no new query, no new table.
 *
 * A term is only ever the (lightly normalised) title of a real, published
 * topic in the SAME grid as the page being rendered — never a fuzzy or
 * cross-grid match — so every generated link resolves to a real, contextually
 * relevant canonical topic URL. No React/server imports, so this is safe to
 * unit-test in isolation from `Markdown.tsx`.
 */
import type { LearningTree } from "@/lib/learning.types";
import { flattenTopics } from "@/lib/learning.types";

export interface TopicLinkEntry {
  /** Lowercased, whole-word-matchable aliases for this topic. */
  terms: string[];
  href: string;
  label: string;
  /** Used to cap linking a given topic to once per page. */
  topicKey: string;
}

/** Shared mutable dedup/cap state for the auto-linking pass in
 *  `Markdown.tsx`, reused across every content block on one topic page so a
 *  given topic links at most once and the total link count is bounded
 *  page-wide, not per block. */
export interface TopicLinkState {
  usedTopics: Set<string>;
  linksLeft: number;
}

/** Default cap keeps auto-linking a light-touch enhancement, never keyword
 *  stuffing — a long tutorial page gets at most this many auto-links total. */
const DEFAULT_MAX_LINKS = 8;

export function createTopicLinkState(maxLinks = DEFAULT_MAX_LINKS): TopicLinkState {
  return { usedTopics: new Set(), linksLeft: maxLinks };
}

/** Wrapper phrases stripped off a topic title before it becomes a link term —
 *  keeps aliases to the meaningful noun/technical-term core (e.g. "Introduction
 *  to Java Arrays" -> "Java Arrays"), not a fuzzy match. */
const STRIP_PREFIXES = [/^introduction to\s+/i, /^understanding\s+/i, /^what is\s+/i, /^a guide to\s+/i];
const STRIP_SUFFIXES = [
  /\s+tutorial$/i,
  /\s+examples?$/i,
  /\s+in (java|python|javascript|c\+\+|c|sql|js)$/i,
  /\s+overview$/i,
];

/** Titles/aliases too generic to safely auto-link (would over-match unrelated
 *  prose even though they're legitimate topic titles). */
const TOO_GENERIC = new Set([
  "example",
  "examples",
  "overview",
  "summary",
  "syntax",
  "note",
  "notes",
  "introduction",
  "basics",
  "tutorial",
]);

const MIN_TERM_LENGTH = 4;

function normalize(title: string): string {
  let t = title.trim();
  for (const re of STRIP_PREFIXES) t = t.replace(re, "");
  for (const re of STRIP_SUFFIXES) t = t.replace(re, "");
  return t.trim();
}

/** Build the per-grid glossary for one topic page render. Excludes the
 *  current topic itself (no self-links) and any topic whose normalised title
 *  is too short/generic to link safely. */
export function buildTopicLinkIndex(
  tree: LearningTree | null,
  gridSlug: string,
  currentTopicSlug: string,
): TopicLinkEntry[] {
  if (!tree) return [];
  const entries: TopicLinkEntry[] = [];

  for (const { topic } of flattenTopics(tree)) {
    if (topic.slug === currentTopicSlug) continue;

    const terms = new Set<string>();
    for (const raw of [topic.title, normalize(topic.title)]) {
      const term = raw.trim().toLowerCase();
      if (term.length < MIN_TERM_LENGTH || TOO_GENERIC.has(term)) continue;
      terms.add(term);
    }
    if (terms.size === 0) continue;

    entries.push({
      terms: Array.from(terms),
      href: `/learning/${gridSlug}/${topic.slug}`,
      label: topic.title,
      topicKey: topic.slug,
    });
  }

  // Longer terms first, so "Java ArrayList" matches before a shorter
  // coincidental substring term would.
  entries.sort((a, b) => Math.max(...b.terms.map((t) => t.length)) - Math.max(...a.terms.map((t) => t.length)));
  return entries;
}
