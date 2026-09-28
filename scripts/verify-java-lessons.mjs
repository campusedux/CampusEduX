#!/usr/bin/env node
/**
 * Content checks for the rewritten Java Tutorials lessons (content/java/).
 *
 *   node scripts/verify-java-lessons.mjs                    # every lesson that has a file
 *   node scripts/verify-java-lessons.mjs --batch 1          # one SQL batch only
 *   node scripts/verify-java-lessons.mjs --slug hashmap     # one or more lessons (repeatable)
 *   node scripts/verify-java-lessons.mjs --no-run           # skip compiling / running the Java programs
 *
 * Prints one line per lesson (prose word count first) and exits 1 when any
 * check fails. Warnings never fail the run. Rules: content/java/STYLE_GUIDE.md.
 *
 * Prose words = every word OUTSIDE fenced code blocks in the lesson body file
 * (code, diagrams and outputs are not counted). Headings, lists, tables and
 * callouts count; link URLs and Markdown symbols do not. The Practice Problems
 * block is counted separately and is not part of the 1200-1500 rule.
 *
 * Every java fence with `static void main` (lesson and practice) is compiled
 * with `javac --release <course.javaRelease>` and run; its stdout must equal the
 * text fence after the next **Output:** label.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "content", "java");
const LESSONS = path.join(DIR, "lessons");

const MIN_WORDS = 1200;
const MAX_WORDS = 1500;
const MIN_DESC = 140;
const MAX_DESC = 155; // website/src/lib/metaDescription.ts cuts at 155
const MAX_TEXT_LINE = 34; // a text block fits ~34 monospace chars on a 360px phone (measured for Spring Boot)
const MAX_INLINE_CODE_RUN = 30;
const WARN_CODE_LINE = 80;
const INTERVIEW_QUESTIONS = 5;
const QUIZ_SIZE = 10;
const FENCE_LANGS = new Set(["java", "text", "bash"]);

const AI_PHRASES = [
  /\bdelv(e|es|ed|ing)\b/i,
  /\bunlock(s|ing)? the power\b/i,
  /\bgame[- ]changer/i,
  /\bin today'?s fast[- ]paced world\b/i,
  /\bcomprehensive guide\b/i,
  /\bseamless(ly)?\b/i,
  /\brobust\b/i,
  /\bleverag(e|es|ed|ing)\b/i,
  /\bcutting[- ]edge\b/i,
  /\bdiv(e|es|ing) into\b/i,
  /\bit is important to note\b/i,
  /\bin conclusion\b/i,
];
const LABEL_WORDS = /\b(chapters?|lessons?|modules?)\b/i;
const NUMBERED_LABEL = /\b(unit|part|chapter|lesson|module|step)\s+(\d+|[ivx]+\b|one|two|three|four|five|six)\b/i;

const args = process.argv.slice(2);
const batchArg = args.includes("--batch") ? Number(args[args.indexOf("--batch") + 1]) : null;
const slugArgs = args.flatMap((a, i) => (a === "--slug" ? [args[i + 1]] : []));
const runCode = !args.includes("--no-run");

const manifest = JSON.parse(fs.readFileSync(path.join(DIR, "manifest.json"), "utf8"));
const { course } = manifest;
const coursePath = `/learning/${course.slug}/`;

// Every live Java topic slug comes from the seed that created them; slugs that now 301 elsewhere are not link targets.
const seedSql = fs.readFileSync(path.join(ROOT, course.seedMigration), "utf8");
const liveSlugs = new Set([...seedSql.matchAll(/\$sl\$([^$]+)\$sl\$/g)].map((m) => m[1]));
const redirects = JSON.parse(fs.readFileSync(path.join(ROOT, "website", "src", "lib", "contentRedirects.json"), "utf8"));
for (const r of redirects) if (r.source.startsWith(coursePath)) liveSlugs.delete(r.source.slice(coursePath.length));

let failed = 0;
let warned = 0;
const globalErrors = [];

// ---------------------------------------------------------------------------
// helpers (same Markdown reading rules as scripts/verify-spring-boot-lessons.mjs)
// ---------------------------------------------------------------------------
function splitFences(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const prose = [];
  const fences = [];
  for (let i = 0; i < lines.length; i += 1) {
    const open = lines[i].match(/^```\s*([\w+-]*)\s*$/);
    if (open) {
      const start = i;
      const body = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i++]);
      fences.push({ lang: open[1], body, start, end: i, closed: i < lines.length });
      for (let k = start; k <= Math.min(i, lines.length - 1); k += 1) prose.push("");
      continue;
    }
    prose.push(lines[i]);
  }
  return { lines, prose, fences };
}

function proseText(md) {
  return splitFences(md)
    .prose.join("\n")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#|]/g, " ");
}

function countWords(md) {
  return proseText(md)
    .split(/\s+/)
    .filter((t) => /[A-Za-z0-9]/.test(t)).length;
}

function headings(md) {
  const { prose } = splitFences(md);
  return prose
    .map((l, i) => ({ m: l.match(/^(#{1,6})\s+(.*)$/), i }))
    .filter((h) => h.m)
    .map((h) => ({ level: h.m[1].length, text: h.m[2].trim(), line: h.i }));
}

/** Body of the first `##` section whose heading matches `re` (up to the next `##`). */
function section(md, re) {
  const { lines } = splitFences(md);
  const hs = headings(md);
  const h = hs.find((x) => x.level === 2 && re.test(x.text));
  if (!h) return null;
  const next = hs.find((x) => x.line > h.line && x.level <= 2);
  return lines.slice(h.line + 1, next ? next.line : lines.length).join("\n");
}

const isDiagram = (f) =>
  f.lang === "text" && f.body.some((l) => /-->|<--|->|<-|^\s*v\s*$|^\s*\^\s*$/.test(l) || /^\s*\|\s*$/.test(l));

function nextProseAfter(lines, idx) {
  let j = idx + 1;
  while (j < lines.length && !lines[j].trim()) j += 1;
  return j < lines.length ? lines[j] : "";
}

function longInlineCode(md) {
  return splitFences(md)
    .prose.flatMap((line) => [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]))
    .filter((code) => code.split(/\s+/).some((run) => [...run].length > MAX_INLINE_CODE_RUN));
}

const internalLinks = (md) => [...md.matchAll(/\]\((\/[^)\s]+)\)/g)].map((m) => m[1]);

/** Java programs (fences with main) and the output each one claims, in document order. */
function programs(md) {
  const { lines, fences } = splitFences(md);
  const out = [];
  fences.forEach((f, idx) => {
    if (f.lang !== "java" || !/static\s+void\s+main\s*\(/.test(f.body.join("\n"))) return;
    // the claimed output is the first text fence after an **Output:** label that comes before the next java fence
    const nextJava = fences.slice(idx + 1).find((x) => x.lang === "java");
    const limit = nextJava ? nextJava.start : lines.length;
    let expected = null;
    let labelLine = -1;
    for (let i = f.end + 1; i < limit; i += 1) if (/^\*\*Output:\*\*\s*$/.test(lines[i].trim())) { labelLine = i; break; }
    if (labelLine >= 0) {
      const t = fences.find((x) => x.start > labelLine && x.start < limit && x.lang === "text");
      if (t) expected = t.body.join("\n");
    }
    out.push({ code: f.body.join("\n"), line: f.start + 1, expected });
  });
  return out;
}

const javaTmp = fs.mkdtempSync(path.join(os.tmpdir(), "verify-java-"));
process.on("exit", () => fs.rmSync(javaTmp, { recursive: true, force: true }));
let progN = 0;

/** Compile + run one program; returns an error string or null. */
function runProgram(code, expected) {
  const m = code.match(/public\s+(?:final\s+|abstract\s+)*class\s+(\w+)/);
  if (!m) return "no public class";
  const dir = path.join(javaTmp, `p${++progN}`);
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, `${m[1]}.java`), code);
  const javac = spawnSync("javac", ["--release", course.javaRelease, "-Xlint:none", "-d", dir, path.join(dir, `${m[1]}.java`)], { encoding: "utf8" });
  if (javac.status !== 0) return `does not compile: ${(javac.stderr || "").split("\n").slice(0, 3).join(" | ")}`;
  const run = spawnSync("java", ["-cp", dir, m[1]], { encoding: "utf8", timeout: 15000 });
  if (run.error) return `run failed: ${run.error.message}`;
  if (run.status !== 0) return `exits with ${run.status}: ${(run.stderr || "").split("\n").slice(0, 2).join(" | ")}`;
  if (expected === null) return "no **Output:** text block after the program";
  const norm = (s) => s.replace(/\r\n/g, "\n").split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").replace(/\n+$/, "");
  const got = norm(run.stdout);
  if (got !== norm(expected)) {
    const g = got.split("\n");
    const e = norm(expected).split("\n");
    const at = g.findIndex((l, i) => l !== e[i]);
    const i = at < 0 ? g.length : at;
    return `output differs at line ${i + 1}: expected ${JSON.stringify(e[i] ?? "<end>")}, got ${JSON.stringify(g[i] ?? "<end>")}`;
  }
  return null;
}

function checkCode(md, where, errors, warnings) {
  const { fences } = splitFences(md);
  for (const f of fences) {
    if (!f.closed) errors.push(`${where}: unclosed code fence at line ${f.start + 1}`);
    if (!FENCE_LANGS.has(f.lang)) errors.push(`${where}: code fence at line ${f.start + 1} has language "${f.lang || "(none)"}"`);
    if (f.lang === "text") {
      const long = f.body.filter((x) => [...x].length > MAX_TEXT_LINE);
      if (long.length) errors.push(`${where}: text block at line ${f.start + 1} has ${long.length} line(s) over ${MAX_TEXT_LINE} chars (scrolls on phones)`);
    }
    if (f.lang === "java") {
      const code = f.body.join("\n");
      const bad = [...code.matchAll(/^\s*import\s+(static\s+)?([\w.]+)/gm)].map((x) => x[2]).filter((n) => !n.startsWith("java."));
      if (bad.length) errors.push(`${where}: java block at line ${f.start + 1} imports ${bad.join(", ")} (only java.* can run on the site)`);
      if (/\brecord\s+\w+\s*\(|instanceof\s+\w+\s+\w+\s*[)&|]|(?<!Collectors)\.toList\(\)|"""/.test(code))
        errors.push(`${where}: java block at line ${f.start + 1} uses a feature newer than Java ${course.javaRelease}`);
      const wide = f.body.filter((x) => x.length > WARN_CODE_LINE).length;
      if (wide) warnings.push(`${where}: java block at line ${f.start + 1} has ${wide} line(s) over ${WARN_CODE_LINE} chars`);
    }
  }
  for (const code of longInlineCode(md)) errors.push(`${where}: inline code \`${code}\` has a run over ${MAX_INLINE_CODE_RUN} chars (widens the page on phones)`);
  const progs = programs(md);
  if (runCode) {
    for (const p of progs) {
      const err = runProgram(p.code, p.expected);
      if (err) errors.push(`${where}: program at line ${p.line} ${err}`);
    }
  }
  return progs;
}

// ---------------------------------------------------------------------------
// manifest-wide checks
// ---------------------------------------------------------------------------
const seenDescs = new Map();
for (const l of manifest.lessons) {
  if (!liveSlugs.has(l.slug)) globalErrors.push(`${l.slug}: not a live java-tutorial topic slug in ${course.seedMigration}`);
  if (!manifest.batches[String(l.batch)]) globalErrors.push(`${l.slug}: batch ${l.batch} has no migration numbers`);
  const metaPath = path.join(LESSONS, `${l.slug}.meta.json`);
  if (fs.existsSync(metaPath)) {
    try {
      const d = JSON.parse(fs.readFileSync(metaPath, "utf8")).description;
      if (seenDescs.has(d)) globalErrors.push(`${l.slug}: description duplicates ${seenDescs.get(d)}`);
      seenDescs.set(d, l.slug);
    } catch {
      /* reported per lesson */
    }
  }
}
if (fs.existsSync(LESSONS)) {
  for (const file of fs.readdirSync(LESSONS)) {
    const slug = file.replace(/(\.practice\.md|\.quiz\.json|\.meta\.json|\.md)$/, "");
    if (!manifest.lessons.some((l) => l.slug === slug)) globalErrors.push(`lessons/${file}: no manifest entry for "${slug}"`);
  }
}

// ---------------------------------------------------------------------------
// per-lesson checks
// ---------------------------------------------------------------------------
function checkLesson(l) {
  const errors = [];
  const warnings = [];
  const read = (suffix) => {
    const p = path.join(LESSONS, `${l.slug}${suffix}`);
    return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
  };
  const body = read(".md");
  const practice = read(".practice.md");
  const quizRaw = read(".quiz.json");
  const metaRaw = read(".meta.json");
  if (!body) return { words: 0, practiceWords: 0, programs: 0, errors: ["lesson file missing"], warnings };

  let meta = {};
  try {
    meta = JSON.parse(metaRaw ?? "null") ?? {};
    if (!metaRaw) errors.push("no .meta.json");
  } catch (e) {
    errors.push(`meta JSON invalid: ${e.message}`);
  }

  // --- word count
  const words = countWords(body);
  if (words < MIN_WORDS || words > MAX_WORDS) errors.push(`prose words ${words} outside ${MIN_WORDS}-${MAX_WORDS}`);
  const practiceWords = practice ? countWords(practice) : 0;

  // --- headings
  const hs = headings(body);
  if (hs.some((h) => h.level === 1)) errors.push("uses a # heading (the page already has the title)");
  for (const h of hs) {
    if (/^\d+[.)]?\s/.test(h.text)) errors.push(`numbered heading "${h.text}"`);
    if (LABEL_WORDS.test(h.text) || NUMBERED_LABEL.test(h.text)) errors.push(`heading uses a structural label: "${h.text}"`);
  }

  // --- structural words + AI phrases in every student-facing text
  const texts = { body: proseText(body), practice: practice ? proseText(practice) : "", quiz: quizRaw ?? "", description: meta.description ?? "" };
  for (const [where, text] of Object.entries(texts)) {
    const label = text.match(LABEL_WORDS) ?? text.match(NUMBERED_LABEL);
    if (label) errors.push(`${where}: structural word "${label[0]}"`);
    for (const re of AI_PHRASES) {
      const m = text.match(re);
      if (m) errors.push(`${where}: banned phrase "${m[0]}"`);
    }
  }

  // --- required sections, in order
  const { lines, prose, fences } = splitFences(body);
  const firstHeading = hs[0]?.line ?? lines.length;
  if (!prose.slice(0, firstHeading).some((x) => x.trim())) errors.push("no opening hook before the first heading");
  const h2 = hs.filter((h) => h.level === 2);
  const ORDER = [
    ["What is ...?", /^what (is|are)\b.*\?$/i],
    ["Why ...", /^why\b/i],
    ["Real-Life Example", /^real-life example$/i],
    ["Syntax", /^syntax$/i],
    ["How ...", /^how\b/i],
    ["Example Programs", /^example programs$/i],
    ["Common Mistakes", /^common mistakes$/i],
    ["Interview Questions", /^interview questions$/i],
    ["Summary", /^summary$/i],
    ["Related Topics", /^related topics$/i],
  ];
  let last = -1;
  for (const [name, re] of ORDER) {
    const at = h2.findIndex((h) => re.test(h.text));
    if (at < 0) errors.push(`no "${name}" section`);
    else if (at < last) errors.push(`"${name}" section is out of order`);
    else last = at;
  }
  if (!/^>\s*\*\*Definition:\*\*/m.test(section(body, /^what (is|are)\b/i) ?? "")) errors.push('"What is" section has no > **Definition:** callout');
  if (!/^>\s*\*\*(Warning|Common mistake):\*\*/im.test(section(body, /^common mistakes$/i) ?? "")) errors.push("Common Mistakes has no > **Warning:** / > **Common mistake:** callout");
  if (!/```java/.test(section(body, /^syntax$/i) ?? "")) errors.push("Syntax has no java block");

  // --- diagram + explanation
  const diagrams = fences.filter(isDiagram);
  if (diagrams.length < 1) errors.push("no flow diagram (text fence with arrows)");
  if (!diagrams.some((f) => f.start > (h2.find((h) => /^how\b/i.test(h.text))?.line ?? Infinity))) warnings.push('no diagram inside the "How ..." section');
  for (const f of diagrams) {
    const after = nextProseAfter(lines, f.end);
    const isPara = after && !/^(#|```|[-*+]\s|\d+[.)]\s|>|\|)/.test(after.trim());
    if (!isPara || after.split(/\s+/).length < 8) errors.push(`diagram at line ${f.start + 1} is not followed by a plain explanation paragraph`);
  }

  // --- example programs
  const ex = section(body, /^example programs$/i) ?? "";
  const exH3 = headings(ex).filter((h) => h.level === 3);
  if (exH3.length < 2 || exH3.length > 3) errors.push(`Example Programs has ${exH3.length} examples, expected 2-3`);
  for (const chunk of ex.split(/\n(?=### )/).filter((c) => c.startsWith("### "))) {
    const name = chunk.split("\n")[0].slice(4);
    if (programs(chunk).length !== 1) errors.push(`example "${name}" must have exactly one java program with main`);
    if (!/^\*\*Output:\*\*/m.test(chunk)) errors.push(`example "${name}" has no **Output:**`);
  }

  // --- comparison table
  const hasTable = lines.some((x, i) => x.includes("|") && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1] ?? "") && /-/.test(lines[i + 1] ?? ""));
  if (l.table && !hasTable) errors.push("manifest asks for a comparison table; none found");

  // --- interview questions
  const iq = section(body, /^interview questions$/i) ?? "";
  const paras = iq.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const qa = paras.filter((p) => /^\*\*[^*]+\?\*\*\s*\n\S/.test(p));
  if (qa.length !== INTERVIEW_QUESTIONS) errors.push(`Interview Questions has ${qa.length} bold-question + answer paragraphs, expected ${INTERVIEW_QUESTIONS}`);
  if (/\b(Ans|Answer)\s*:/.test(iq)) errors.push('Interview Questions must not write an "Ans:" label (the site adds it)');

  // --- summary
  const sum = section(body, /^summary$/i) ?? "";
  const bullets = sum.split("\n").filter((x) => /^[-*]\s/.test(x)).length;
  if (bullets < 5 || bullets > 7) errors.push(`Summary has ${bullets} bullets, expected 5-7`);

  // --- related topics + internal links
  const related = section(body, /^related topics$/i);
  if (related) {
    const rel = internalLinks(related);
    if (rel.length < 2 || rel.length > 4) errors.push(`Related Topics has ${rel.length} links, expected 2-4`);
    const relSlugs = rel.filter((h) => h.startsWith(coursePath)).map((h) => h.slice(coursePath.length));
    if (JSON.stringify(relSlugs) !== JSON.stringify(meta.related ?? [])) errors.push("Related Topics links differ from meta.json related");
  }
  for (const href of [...internalLinks(body), ...(practice ? internalLinks(practice) : [])]) {
    if (!href.startsWith(coursePath)) {
      errors.push(`link outside the Java course: ${href}`);
      continue;
    }
    const target = href.slice(coursePath.length).replace(/[#?].*$/, "");
    if (!liveSlugs.has(target)) errors.push(`broken or redirected link ${href}`);
    else if (target === l.slug) errors.push("links to itself");
  }

  // --- code
  const bodyProgs = checkCode(body, "body", errors, warnings);

  // --- practice problems
  let practiceProgs = [];
  if (l.practice) {
    if (!practice) errors.push("manifest has practice: true but there is no .practice.md");
    else {
      const ph = headings(practice).filter((h) => h.level === 3);
      if (headings(practice).some((h) => h.level < 3)) errors.push("practice uses # or ## headings (only ### problems)");
      if (ph.length !== 2) errors.push(`practice has ${ph.length} problems, expected 2`);
      if (!/^Easy:/.test(ph[0]?.text ?? "") || !/^Medium:/.test(ph[1]?.text ?? "")) errors.push('practice problems must be "Easy: ..." then "Medium: ..."');
      for (const chunk of practice.split(/\n(?=### )/).filter((c) => c.startsWith("### "))) {
        const name = chunk.split("\n")[0].slice(4);
        if (!/^>\s*\*\*Hint:\*\*/m.test(chunk)) errors.push(`"${name}": no > **Hint:**`);
        if (!/^\*\*Answer:\*\*/m.test(chunk)) errors.push(`"${name}": no **Answer:**`);
        if (programs(chunk).length !== 1) errors.push(`"${name}": needs exactly one java solution with main`);
      }
      practiceProgs = checkCode(practice, "practice", errors, warnings);
    }
  } else if (practice) errors.push("manifest has practice: false but a .practice.md exists (it would not be published)");

  // --- MCQ test
  if (l.quiz) {
    if (!quizRaw) errors.push("manifest has quiz: true but there is no .quiz.json");
    else {
      let quiz;
      try {
        quiz = JSON.parse(quizRaw);
      } catch (e) {
        errors.push(`quiz JSON invalid: ${e.message}`);
      }
      const qs = quiz?.questions ?? [];
      if (qs.length !== QUIZ_SIZE) errors.push(`MCQ test has ${qs.length} questions, expected ${QUIZ_SIZE}`);
      const stems = new Set();
      qs.forEach((q, i) => {
        const n = i + 1;
        if (!q.question?.trim()) errors.push(`Q${n}: empty question`);
        if (stems.has(q.question)) errors.push(`Q${n}: duplicate question`);
        stems.add(q.question);
        if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`Q${n}: needs exactly 4 options`);
        else if (new Set(q.options.map((o) => String(o).trim())).size !== 4 || q.options.some((o) => !String(o).trim())) errors.push(`Q${n}: options must be 4 distinct, non-empty strings`);
        if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) errors.push(`Q${n}: answer must be 0-3`);
        if (!q.explanation?.trim() || /\n/.test(q.explanation) || q.explanation.length > 220) errors.push(`Q${n}: explanation must be one line (1-220 chars)`);
        if (!["concept", "output", "bug"].includes(q.kind)) errors.push(`Q${n}: kind must be concept / output / bug`);
      });
      if (new Set(qs.map((q) => q.kind)).size < 3) errors.push("test must mix concept, output and bug questions");
      if (qs.filter((q) => q.kind !== "concept").length < 3) errors.push("test needs at least 3 output / bug questions");
      if (new Set(qs.map((q) => q.answer)).size < 4) errors.push("correct answers must use every option index 0-3 at least once");
    }
  } else if (quizRaw) errors.push("manifest has quiz: false but a .quiz.json exists (it would not be published)");

  // --- SEO description
  const d = meta.description ?? "";
  if (d.length < MIN_DESC || d.length > MAX_DESC) errors.push(`description is ${d.length} chars, expected ${MIN_DESC}-${MAX_DESC}`);
  if (/\s{2,}|\n/.test(d)) errors.push("description has double spaces or line breaks");

  return { words, practiceWords, programs: bodyProgs.length + practiceProgs.length, errors, warnings };
}

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------
if (runCode) {
  try {
    execFileSync("javac", ["-version"], { stdio: "ignore" });
  } catch {
    console.error("javac not found: install a JDK or pass --no-run");
    process.exit(2);
  }
}
const targets = manifest.lessons.filter(
  (l) => (batchArg === null || l.batch === batchArg) && (slugArgs.length === 0 || slugArgs.includes(l.slug)),
);
console.log(`Java lesson rewrite: ${manifest.lessons.length} in manifest` + (batchArg !== null ? `, checking batch ${batchArg}` : "") + (runCode ? "" : " (programs NOT run)"));
console.log("");
console.log("status  words  practice  programs  slug");
for (const l of targets) {
  const r = checkLesson(l);
  const ok = r.errors.length === 0;
  if (!ok) failed += 1;
  warned += r.warnings.length;
  console.log(`${ok ? "PASS" : "FAIL"}    ${String(r.words).padStart(5)}  ${String(r.practiceWords).padStart(8)}  ${String(r.programs).padStart(8)}  ${l.slug}`);
  for (const e of r.errors) console.log(`          x ${e}`);
  for (const w of r.warnings) console.log(`          ! ${w}`);
}
if (globalErrors.length) {
  console.log("\nManifest:");
  for (const e of globalErrors) console.log(`          x ${e}`);
}
if (targets.length === 0) console.log("(no lessons in scope)");
console.log(`\n${targets.length - failed} passed, ${failed} failed, ${warned} warning(s)${globalErrors.length ? `, ${globalErrors.length} manifest error(s)` : ""}`);
process.exit(failed || globalErrors.length ? 1 : 0);
