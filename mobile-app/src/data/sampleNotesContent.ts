import type { PrepNote } from "@/types";

/**
 * Fallback content for Preparation → Notes, shown only when the `prep_notes`
 * table can't be reached (migration 0028 / admin 010 not applied, offline).
 * A student with the table present but empty correctly sees an empty state.
 */

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

const note = (
  id: string,
  title: string,
  category: PrepNote["category"],
  topic: string,
  tags: string[],
  content: string,
  opts: Partial<Pick<PrepNote, "isPremium" | "fileUrl">> = {}
): PrepNote => ({
  id,
  title,
  content,
  category,
  topic,
  tags,
  fileUrl: opts.fileUrl ?? null,
  thumbnailUrl: null,
  isPremium: opts.isPremium ?? false,
  isPublished: true,
  createdAt: daysAgo(Number(id.replace(/\D/g, "")) || 1),
  updatedAt: daysAgo(0),
  isBookmarked: false,
});

export const SAMPLE_NOTES: PrepNote[] = [
  note(
    "n1",
    "Percentages — Core Formulas & Shortcuts",
    "Aptitude",
    "Percentages",
    ["percentage", "quant", "shortcut"],
    "Key ideas:\n\n• x% of y = y% of x.\n• Successive change of a% then b% = a + b + ab/100 (%).\n• Fraction ↔ percent: 1/8 = 12.5%, 1/6 ≈ 16.67%, 1/3 ≈ 33.33%.\n\nPractice: If a number is increased by 20% and then decreased by 20%, the net change is −4%."
  ),
  note(
    "n2",
    "Blood Relations — Solving Approach",
    "Logical Reasoning",
    "Blood Relations",
    ["reasoning", "family-tree"],
    "Draw a family tree top-down. Use + for male, − for female, = for married couple.\n\nWork from the statement's fixed point outward. For 'pointing to a photo' puzzles, replace 'I / me' with the speaker and simplify one relation at a time."
  ),
  note(
    "n3",
    "Reading Comprehension — Time Strategy",
    "Verbal",
    "Reading Comprehension",
    ["verbal", "rc", "strategy"],
    "1. Skim the passage for structure (60–90s).\n2. Read questions, then scan back for the exact lines.\n3. Eliminate options with extreme words ('always', 'never') unless the passage is equally strong.\n4. Tone questions: match the author's adjectives, not your opinion."
  ),
  note(
    "n4",
    "Two Pointers & Sliding Window",
    "DSA",
    "Arrays",
    ["dsa", "arrays", "patterns"],
    "Sliding window: maintain a window [l, r]; expand r, shrink l while a constraint breaks. O(n).\n\nUse for: longest substring without repeats, max sum subarray of size k, minimum window substring.\n\nTwo pointers (sorted array): l = 0, r = n−1; move based on comparison with target."
  ),
  note(
    "n5",
    "Big-O Cheat Sheet",
    "Coding",
    "Complexity",
    ["complexity", "interview"],
    "Array access O(1) · search O(n) · sorted search O(log n).\nHashMap avg O(1) insert/lookup.\nSorting O(n log n).\nBFS/DFS on graph O(V + E).\nRecursion with memo: states × work-per-state."
  ),
  note(
    "n6",
    "STAR Method for HR Answers",
    "HR",
    "Behavioural",
    ["hr", "star", "behavioural"],
    "Situation → Task → Action → Result. Keep S+T to two sentences, spend most time on A (what YOU did), always end with a measurable R.\n\nPrepare 4 stories that can be reused: a conflict, a failure, a leadership moment, a deadline crunch."
  ),
  note(
    "n7",
    "OOP — Interview Quick Revision",
    "Technical Interview",
    "OOP",
    ["oop", "cs-fundamentals"],
    "4 pillars: Encapsulation, Abstraction, Inheritance, Polymorphism.\n\nOverloading = compile-time (same name, different params). Overriding = run-time (subclass redefines).\n\nComposition over inheritance when the relationship is 'has-a', not 'is-a'.",
    { isPremium: true }
  ),
  note(
    "n8",
    "TCS NQT — Pattern & Sections",
    "Company Preparation",
    "TCS",
    ["tcs", "nqt", "pattern"],
    "Sections: Numerical Ability, Verbal Ability, Reasoning Ability, Programming Logic, Coding (2 questions).\n\nNo strong negative marking on NQT, but sectional cut-offs apply — attempt every section.",
    { isPremium: true }
  ),
  note(
    "n9",
    "Placement Prep — 8 Week Plan",
    "General Placement",
    "Roadmap",
    ["roadmap", "plan"],
    "Weeks 1–2: Quant + Reasoning basics.\nWeeks 3–5: DSA (arrays, strings, hashing, trees, graphs) + 2 problems/day.\nWeeks 6–7: CS fundamentals (DBMS, OS, CN, OOP) + company-specific patterns.\nWeek 8: Mock tests + HR stories + resume polish."
  ),
];
