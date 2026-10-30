import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

type Question = { id: string; test_id: string; question_text: string; correct_index: number };
type Package = {
  slug: string;
  notes: string;
  tests: { id: string; questions: Question[] }[];
  original_questions: Question[];
  coding_problems: { id: string; slug: string; solution_sql: string }[];
};

const root = path.resolve(process.cwd(), "content/dbms-sql");
const packages: Package[] = readdirSync(path.join(root, "topics"))
  .filter((name) => name.endsWith(".json"))
  .map((name) => JSON.parse(readFileSync(path.join(root, "topics", name), "utf8")));
const inventory = JSON.parse(readFileSync(path.join(root, "progress.json"), "utf8")) as {
  topics: { slug: string }[];
  coverage_topics: { slug: string }[];
};
const destinations = new Set([...inventory.topics, ...inventory.coverage_topics].map(({ slug }) => slug));

describe("DBMS curriculum continuity and internal similarity", () => {
  it("keeps assessment identities globally unique and existing canonical answers stable", () => {
    const identities = new Set<string>();
    for (const topic of packages) {
      const current = new Map<string, Question>();
      for (const test of topic.tests) {
        expect(identities.has(test.id), `${topic.slug}: duplicate test ${test.id}`).toBe(false);
        identities.add(test.id);
        for (const question of test.questions) {
          expect(question.test_id, `${topic.slug}: question owner`).toBe(test.id);
          expect(identities.has(question.id), `${topic.slug}: duplicate question ${question.id}`).toBe(false);
          identities.add(question.id);
          current.set(question.id, question);
        }
      }
      for (const previous of topic.original_questions) {
        const retained = current.get(previous.id);
        expect(retained, `${topic.slug}: removed question ${previous.id}`).toBeDefined();
        expect(retained?.test_id).toBe(previous.test_id);
        expect(retained?.correct_index, `${topic.slug}: changed answer ${previous.id}`).toBe(previous.correct_index);
      }
      for (const problem of topic.coding_problems) {
        expect(identities.has(problem.id), `${topic.slug}: duplicate exercise ${problem.id}`).toBe(false);
        identities.add(problem.id);
      }
    }
  });

  it("resolves contextual curriculum links to real topic identities", () => {
    const broken: string[] = [];
    for (const topic of packages) {
      for (const match of topic.notes.matchAll(/\]\(\/learning\/dbms-sql-tutorial\/([^\s)#?]+)(?:[?#][^\s)]*)?\)/g)) {
        if (!destinations.has(match[1])) broken.push(`${topic.slug} -> ${match[1]}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it("flags substantial prose reused verbatim across different topics", () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];
    for (const topic of packages) {
      const prose = topic.notes.replace(/```[\s\S]*?```/g, "");
      for (const paragraph of prose.split(/\n\s*\n/)) {
        const normalized = paragraph.toLowerCase().replace(/\s+/g, " ").trim();
        // Short definitions and shared terminology are legitimate. Long exact
        // repeats merit editorial review; this is not external plagiarism clearance.
        if (normalized.split(" ").length < 60) continue;
        const previous = seen.get(normalized);
        if (previous && previous !== topic.slug) duplicates.push(`${previous} / ${topic.slug}: ${normalized.slice(0, 90)}`);
        seen.set(normalized, topic.slug);
      }
    }
    expect(duplicates).toEqual([]);
  });

  it("keeps MySQL bulk insertion from selecting its target inside an EXISTS subquery", () => {
    const topic = packages.find(({ slug }) => slug === "bulk-loading");
    expect(topic).toBeDefined();
    const examples = [
      ...[...topic!.notes.matchAll(/```sql\n([\s\S]*?)```/g)].map((match) => match[1]),
      ...topic!.coding_problems.map(({ solution_sql }) => solution_sql),
    ];
    for (const sql of examples) {
      // MySQL 8.4 permits the insert target in the outer SELECT's FROM,
      // but prohibits reading that same target in a SELECT subquery.
      expect(sql).not.toMatch(/\bEXISTS\s*\(\s*SELECT\b[^;]*\bFROM\s+accepted_catalogue\b/i);
    }
  });
});
