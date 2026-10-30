import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type Question = {
  id: string; test_id: string; question_text: string; options: string[];
  correct_index: number; explanation: string; marks: number; sort_order: number;
};
type Package = {
  slug: string; source_ref: string; new_coverage?: boolean;
  original_questions: Question[];
  integration: { original_note_sha256: string };
  tests: { id: string; questions: Question[] }[];
  coding_problems: {
    id: string; slug: string; difficulty: string; existing_problem?: boolean;
    schema_sql: string; seed_sql: string; check_sql?: string;
    original_description_md5?: string;
  }[];
};

// Match the existing Python audit's literal masking. This test reads the actual
// checked-in seeds, so an edited package snapshot cannot redefine saved IDs or
// canonical answer positions. It never generates or applies migration SQL.
function maskLiterals(sql: string) {
  const literals: string[] = [];
  const pattern = /--[^\n]*|\/\*[\s\S]*?\*\/|(?<tag>\$[A-Za-z_][A-Za-z_0-9]*\$|\$\$)[\s\S]*?\k<tag>|'(?:''|[^'])*'/g;
  const masked = sql.replace(pattern, (raw: string) => {
    if (raw.startsWith("--") || raw.startsWith("/*")) return " ";
    const tag = raw.startsWith("$") ? raw.slice(0, raw.indexOf("$", 1) + 1) : null;
    const value = tag ? raw.slice(tag.length, -tag.length) : raw.slice(1, -1).replace(/''/g, "'");
    literals.push(value);
    return `@${literals.length - 1}@`;
  });
  return { masked, literals };
}

function value(expression: string, literals: string[]): string | number | null {
  const token = expression.trim();
  const match = token.match(/^@(\d+)@(?:::\w+)?$/);
  if (match) return literals[Number(match[1])];
  return /^-?\d+$/.test(token) ? Number(token) : null;
}

const directory = path.resolve(process.cwd(), "../mobile-app/supabase/migrations");
const notes = new Map<string, string>();
const questions = new Map<string, Question>();
const exercises: { reference: string; fields: Record<string, string | number | null> }[] = [];
for (const filename of readdirSync(directory).filter((name) => /^009[2-9]_seed_dbms_sql_.*\.sql$/.test(name))) {
  const { masked, literals } = maskLiterals(readFileSync(path.join(directory, filename), "utf8"));
  for (const statement of masked.split(";")) {
    const note = statement.match(/insert into public\.learning_contents\s*\((.*?)\)\s*select\s+(.*?)\s+from t\b/is);
    const reference = statement.match(/source_ref\s*=\s*@(\d+)@/i);
    if (note && reference) {
      const columns = note[1].split(",").map((column) => column.trim());
      // Body is a standalone masked literal; later metadata functions may have
      // commas but cannot change the positions of the preceding body field.
      const body = value(note[2].split(",")[columns.indexOf("body")], literals);
      if (typeof body !== "string") throw new Error(`Unrecognized note shape: ${filename}`);
      notes.set(literals[Number(reference[1])], body);
    }
    const exercise = statement.match(/insert into public\.dsa_problems\s*\((.*?)\)\s*select\s+([\s\S]*?)\s+from\s+[gt]\b/is);
    if (exercise && reference) {
      const columns = exercise[1].split(",").map((column) => column.trim());
      const expressions: string[] = [];
      let start = 0;
      let depth = 0;
      for (let index = 0; index < exercise[2].length; index++) {
        const char = exercise[2][index];
        if (char === "(") depth++;
        if (char === ")") depth--;
        if (char === "," && depth === 0) {
          expressions.push(exercise[2].slice(start, index));
          start = index + 1;
        }
      }
      expressions.push(exercise[2].slice(start));
      if (expressions.length !== columns.length) throw new Error(`Unrecognized exercise shape: ${filename}`);
      exercises.push({
        reference: literals[Number(reference[1])],
        fields: Object.fromEntries(columns.map((column, index) => [column, value(expressions[index], literals)])),
      });
    }
    const insert = statement.match(/insert into public\.test_questions\s*\((.*?)\)\s*values\s+([\s\S]*)/i);
    if (!insert) continue;
    const columns = insert[1].split(",").map((column) => column.trim());
    const rows = insert[2].split(/\bon conflict\b/i)[0];
    for (const row of rows.matchAll(/\(([^()]*)\)/g)) {
      const fields = row[1].split(",");
      if (fields.length !== columns.length) throw new Error(`Unrecognized question shape: ${filename}`);
      const record = Object.fromEntries(columns.map((column, index) => [column, value(fields[index], literals)]));
      record.options = JSON.parse(String(record.options));
      const question = record as unknown as Question;
      if (questions.has(question.id)) throw new Error(`Duplicate source question: ${question.id}`);
      questions.set(question.id, question);
    }
  }
}
const topicDirectory = path.resolve(process.cwd(), "content/dbms-sql/topics");
const packages: Package[] = readdirSync(topicDirectory).filter((name) => name.endsWith(".json"))
  .map((name) => JSON.parse(readFileSync(path.join(topicDirectory, name), "utf8")));

describe("DBMS authored content against authoritative repository seeds", () => {
  it("accounts for the full seed inventory and preserves canonical note fingerprints", () => {
    expect(notes.size).toBe(294);
    expect(questions.size).toBe(2352);
    for (const topic of packages.filter((item) => !item.new_coverage)) {
      const original = notes.get(topic.source_ref);
      expect(original, topic.slug).toBeDefined();
      expect(topic.integration.original_note_sha256, topic.slug)
        .toBe(createHash("sha256").update(original!).digest("hex"));
    }
  });

  it("retains every seeded question snapshot, test owner and canonical answer position", () => {
    for (const topic of packages.filter((item) => !item.new_coverage)) {
      const sourceQuestions = [...questions.values()].filter((question) => question.test_id === topic.tests[0].id);
      expect(sourceQuestions, topic.slug).toHaveLength(8);
      expect(topic.original_questions, topic.slug).toHaveLength(sourceQuestions.length);
      const current = new Map(topic.tests.flatMap((test) => test.questions).map((question) => [question.id, question]));
      for (const source of sourceQuestions) {
        expect(topic.original_questions.find((question) => question.id === source.id), `${topic.slug}: snapshot ${source.id}`).toEqual(source);
        expect(current.get(source.id)?.test_id, `${topic.slug}: owner ${source.id}`).toBe(source.test_id);
        expect(current.get(source.id)?.correct_index, `${topic.slug}: answer ${source.id}`).toBe(source.correct_index);
      }
    }
  });

  it("preserves existing exercise identities, setup and trailing checkers", () => {
    expect(exercises).toHaveLength(49);
    const expectedDescriptionHashes: Record<string, string> = {};
    const recordedDescriptionHashes: Record<string, string | undefined> = {};
    for (const topic of packages.filter((item) => !item.new_coverage)) {
      for (const { fields: original } of exercises.filter((item) => item.reference === topic.source_ref)) {
        const retained = topic.coding_problems.find((problem) => problem.id === original.id);
        expect(retained, `${topic.slug}: removed exercise ${original.id}`).toBeDefined();
        expect(retained?.existing_problem, topic.slug).toBe(true);
        expect(retained?.slug, topic.slug).toBe(original.slug);
        expect(retained?.difficulty, topic.slug).toBe(original.difficulty);
        expect(retained?.schema_sql, topic.slug).toBe(original.sql_schema_sql ?? "");
        expect(retained?.seed_sql, topic.slug).toBe(original.sql_seed_sql ?? "");
        expect(retained?.check_sql ?? null, topic.slug).toBe(original.sql_check_sql ?? null);
        expectedDescriptionHashes[String(original.id)] = createHash("md5").update(String(original.description)).digest("hex");
        recordedDescriptionHashes[String(original.id)] = retained?.original_description_md5;
      }
    }
    expect(recordedDescriptionHashes).toEqual(expectedDescriptionHashes);
  });
});
