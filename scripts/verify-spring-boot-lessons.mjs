#!/usr/bin/env node
/**
 * Content checks for the Spring Boot course (content/spring-boot/).
 *
 *   node scripts/verify-spring-boot-lessons.mjs            # every written lesson
 *   node scripts/verify-spring-boot-lessons.mjs --batch 2  # one SQL batch only
 *
 * Prints one line per lesson (prose word count first) and exits 1 when any
 * check fails. Warnings never fail the run.
 *
 * Prose words = every word OUTSIDE fenced code blocks (code and text diagrams
 * are not counted) in the lesson body file. Headings, lists, tables and
 * callouts count; link URLs and Markdown symbols do not. The Practice Problems
 * block is counted separately and is not part of the 1200-1500 rule.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = process.env.SPRING_BOOT_CONTENT_DIR ?? path.join(ROOT, "content", "spring-boot");
const LESSONS = path.join(DIR, "lessons");

const MIN_WORDS = 1200;
const MAX_WORDS = 1500;
// The site cuts meta descriptions at 155 characters (website/src/lib/metaDescription.ts),
// so the useful range inside the requested 140-160 is 140-155.
const MIN_DESC = 140;
const MAX_DESC = 155;
// Owner rule: diagram lines under 60 characters so they never scroll on a phone. Measured on the
// real lesson page (Chromium, 2026-09-26): a text block fits ~38 monospace characters at 390px
// and ~34 at 360px, so every text block (diagram, folder tree, output) must fit 34.
const MAX_DIAGRAM_LINE = 34;
const MAX_TEXT_LINE = 34;
// Inline `code` cannot wrap inside a run without spaces, so one long run (a full file path or URL)
// widens the whole page on phones. Measured 2026-09-26: 49+ character paths pushed the page to
// 466-516px at a 360px viewport, while runs up to 30 characters fit, even inside the practice card.
const MAX_INLINE_CODE_RUN = 30;
const FENCE_LANGS = new Set(["java", "xml", "html", "properties", "yaml", "bash", "text", "json", "sql", "dockerfile"]);

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

// Structural labels are banned. "Unit" is allowed only as in "unit test(ing)" —
// the owner's own topic list has "Unit Testing with JUnit 5".
const LABEL_WORDS = /\b(chapters?|lessons?|modules?|parts?)\b|\bunits?\b(?!\s+test)/i;
const NUMBERED_LABEL = /\b(unit|part|chapter|lesson|module|step)\s+(\d+|[ivx]+\b|one|two|three|four|five|six)\b/i;

const args = process.argv.slice(2);
const batchArg = args.includes("--batch") ? Number(args[args.indexOf("--batch") + 1]) : null;

const manifest = JSON.parse(fs.readFileSync(path.join(DIR, "manifest.json"), "utf8"));
const bySlug = new Map(manifest.lessons.map((l) => [l.slug, l]));
const coursePath = `/learning/${manifest.course.slug}/`;

let failed = 0;
let warned = 0;
const globalErrors = [];

// ---------------------------------------------------------------------------
// helpers
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
      // keep prose[] line-aligned with lines[] (one blank per fence line)
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
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // link text only
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

function section(md, title) {
  const { lines } = splitFences(md);
  const hs = headings(md);
  const h = hs.find((x) => x.level === 2 && x.text.toLowerCase() === title.toLowerCase());
  if (!h) return null;
  const next = hs.find((x) => x.line > h.line && x.level <= 2);
  return lines.slice(h.line + 1, next ? next.line : lines.length).join("\n");
}

const isDiagram = (f) =>
  f.lang === "text" && f.body.some((l) => /-->|<--|->|<-|^\s*v\s*$|^\s*\^\s*$/.test(l) || /^\s*\|\s*$/.test(l));
const isEr = (f) => f.lang === "text" && f.body.some((l) => /\bPK\b/.test(l)) && f.body.some((l) => /\bFK\b|1\s*-+\s*[*<]|\*\s*-+\s*1/.test(l));

function nextProseAfter(lines, idx) {
  let j = idx + 1;
  while (j < lines.length && !lines[j].trim()) j += 1;
  return j < lines.length ? lines[j] : "";
}

/** Inline code spans (outside fences) whose longest run without spaces is too long for a phone. */
function longInlineCode(md) {
  return splitFences(md)
    .prose.flatMap((line) => [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]))
    .filter((code) => code.split(/\s+/).some((run) => [...run].length > MAX_INLINE_CODE_RUN));
}

function internalLinks(md) {
  return [...md.matchAll(/\]\((\/[^)\s]+)\)/g)].map((m) => m[1]);
}

// ---------------------------------------------------------------------------
// manifest-wide checks (all 95 topics, written or not)
// ---------------------------------------------------------------------------
const seenTitles = new Set();
const seenDescs = new Map();
for (const l of manifest.lessons) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(l.slug)) globalErrors.push(`${l.slug}: slug is not lowercase-hyphenated`);
  if (LABEL_WORDS.test(l.slug.replace(/-/g, " ")) || NUMBERED_LABEL.test(l.slug.replace(/-/g, " ")))
    globalErrors.push(`${l.slug}: slug uses a unit/chapter/lesson/module/part label`);
  if (LABEL_WORDS.test(l.title) || NUMBERED_LABEL.test(l.title)) globalErrors.push(`${l.slug}: title "${l.title}" uses a structural label`);
  if (/^\s*\d/.test(l.title)) globalErrors.push(`${l.slug}: title starts with a number`);
  if (seenTitles.has(l.title.toLowerCase())) globalErrors.push(`${l.slug}: duplicate title`);
  seenTitles.add(l.title.toLowerCase());
  if (!manifest.groups.some((g) => g.slug === l.group)) globalErrors.push(`${l.slug}: unknown group ${l.group}`);
  if (l.status === "written") {
    if (seenDescs.has(l.description)) globalErrors.push(`${l.slug}: description duplicates ${seenDescs.get(l.description)}`);
    seenDescs.set(l.description, l.slug);
  }
}
for (const g of manifest.groups) {
  if (LABEL_WORDS.test(g.name)) globalErrors.push(`group "${g.name}" uses a structural label`);
}
for (const file of fs.readdirSync(LESSONS)) {
  const slug = file.replace(/(\.practice\.md|\.quiz\.json|\.md)$/, "");
  if (!bySlug.has(slug)) globalErrors.push(`lessons/${file}: no manifest entry for "${slug}"`);
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
  if (!body) return { words: 0, practiceWords: 0, errors: ["lesson file missing"], warnings, diagrams: 0 };

  // --- word count
  const words = countWords(body);
  if (words < MIN_WORDS || words > MAX_WORDS) errors.push(`prose words ${words} outside ${MIN_WORDS}-${MAX_WORDS}`);
  const practiceWords = practice ? countWords(practice) : 0;

  // --- title / headings
  const hs = headings(body);
  if (hs.some((h) => h.level === 1)) errors.push("uses a # heading (the page already has the title)");
  for (const h of hs) {
    if (/^\d+[.)]?\s/.test(h.text)) errors.push(`numbered heading "${h.text}"`);
    if (LABEL_WORDS.test(h.text) || NUMBERED_LABEL.test(h.text)) errors.push(`heading uses a structural label: "${h.text}"`);
  }

  // --- structural words + AI phrases in every student-facing text
  const quizText = quizRaw ?? "";
  const texts = { body: proseText(body), practice: practice ? proseText(practice) : "", quiz: quizText, description: l.description };
  for (const [where, text] of Object.entries(texts)) {
    const label = text.match(/\b(chapters?|lessons?|modules?)\b/i) ?? text.match(NUMBERED_LABEL);
    if (label) errors.push(`${where}: structural word "${label[0]}"`);
    for (const re of AI_PHRASES) {
      const m = text.match(re);
      if (m) errors.push(`${where}: banned phrase "${m[0]}"`);
    }
  }

  // --- required sections
  const { lines, prose, fences } = splitFences(body);
  const firstHeading = hs[0]?.line ?? lines.length;
  if (!prose.slice(0, firstHeading).some((x) => x.trim())) errors.push("no opening hook before the first heading");
  if (!hs.some((h) => h.level === 2 && /^what (is|are)\b/i.test(h.text))) errors.push('no "What is ...?" section');
  if (!hs.some((h) => h.level === 2 && /^why\b/i.test(h.text))) errors.push('no "Why ..." section');
  if (!hs.some((h) => h.level === 2 && /^how it works$/i.test(h.text))) errors.push('no "How it works" section');
  if (!hs.some((h) => h.level === 2 && /^key points to remember$/i.test(h.text))) errors.push('no "Key Points to Remember" section');
  if (!/^>\s*\*\*(Tip|Warning|Note|Definition|Remember|Common mistake)s?:\*\*/im.test(body)) errors.push("no Tip / Warning / Note callout");
  if (l.practical) {
    const code = section(body, "Code Example");
    if (!code) errors.push('practical topic has no "Code Example" section');
    else {
      if (!/```(java|xml|properties|yaml)/.test(code)) errors.push("Code Example has no code block");
      if (!/\*\*Output:\*\*/.test(code)) errors.push("Code Example has no **Output:**");
    }
    if (!section(body, "Code Explained")) errors.push('practical topic has no "Code Explained" section');
  }

  // --- fences + diagrams
  for (const f of fences) {
    if (!f.closed) errors.push(`unclosed code fence at line ${f.start + 1}`);
    if (!FENCE_LANGS.has(f.lang)) errors.push(`code fence at line ${f.start + 1} has language "${f.lang || "(none)"}"`);
  }
  const diagrams = fences.filter(isDiagram);
  if (diagrams.length < 1) errors.push("no flow diagram (text fence with arrows)");
  if (l.er && !fences.some(isEr)) errors.push("topic needs an ER diagram (text fence with PK and FK / 1---* links)");
  for (const f of fences.filter((x) => x.lang === "text")) {
    const diagram = isDiagram(f) || isEr(f);
    const max = diagram ? MAX_DIAGRAM_LINE : MAX_TEXT_LINE;
    const long = f.body.filter((x) => [...x].length > max);
    if (long.length) errors.push(`${diagram ? "diagram" : "text block"} at line ${f.start + 1} has ${long.length} line(s) over ${max} chars (scrolls on phones)`);
  }
  for (const f of [...diagrams, ...fences.filter(isEr)]) {
    const after = nextProseAfter(lines, f.end);
    const isPara = after && !/^(#|```|[-*+]\s|\d+[.)]\s|>|\|)/.test(after.trim());
    if (!isPara || after.split(/\s+/).length < 8) errors.push(`diagram at line ${f.start + 1} is not followed by a plain explanation paragraph`);
  }

  // --- one Spring Boot / Java version and Boot 4 starter names in every code block (STYLE_GUIDE.md)
  for (const [where, md] of [["body", body], ["practice", practice ?? ""]]) {
    for (const f of splitFences(md).fences) {
      const code = f.body.join("\n");
      for (const m of code.matchAll(/<artifactId>spring-boot-starter-parent<\/artifactId>\s*<version>([^<]+)<\/version>/g)) {
        if (m[1] !== manifest.course.bootVersion) errors.push(`${where}: starter parent ${m[1]}, course uses ${manifest.course.bootVersion}`);
      }
      for (const m of code.matchAll(/<java\.version>([^<]+)<\/java\.version>/g)) {
        if (m[1] !== manifest.course.javaVersion) errors.push(`${where}: java.version ${m[1]}, course uses ${manifest.course.javaVersion}`);
      }
      // (curl's `dependencies=web` is Initializr's id for "Spring Web" and correctly yields webmvc)
      if (/<artifactId>spring-boot-starter-web<\/artifactId>/.test(code))
        errors.push(`${where}: uses deprecated spring-boot-starter-web; Boot 4 name is spring-boot-starter-webmvc`);
      for (const m of code.matchAll(/bootVersion=([\w.-]+)/g)) {
        if (m[1] !== manifest.course.bootVersion) errors.push(`${where}: curl bootVersion=${m[1]}, course uses ${manifest.course.bootVersion}`);
      }
    }
  }

  // --- inline code that would widen the page on phones
  for (const [where, md] of [["body", body], ["practice", practice ?? ""]]) {
    for (const code of longInlineCode(md)) errors.push(`${where}: inline code \`${code}\` has a run over ${MAX_INLINE_CODE_RUN} chars (widens the page on phones)`);
  }

  // --- MCQ test: exactly one per topic
  if (!quizRaw) errors.push("no MCQ test (.quiz.json)");
  else {
    let quiz;
    try {
      quiz = JSON.parse(quizRaw);
    } catch (e) {
      errors.push(`quiz JSON invalid: ${e.message}`);
    }
    const qs = quiz?.questions ?? [];
    const want = l.quizSize ?? 5;
    if (want !== 5 && want !== 3) errors.push(`quizSize must be 5 or 3, not ${want}`);
    if (qs.length !== want) errors.push(`MCQ test has ${qs.length} questions, expected ${want}`);
    const stems = new Set();
    qs.forEach((q, i) => {
      const n = i + 1;
      if (!q.question?.trim()) errors.push(`Q${n}: empty question`);
      if (stems.has(q.question)) errors.push(`Q${n}: duplicate question`);
      stems.add(q.question);
      if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`Q${n}: needs exactly 4 options`);
      else if (new Set(q.options.map((o) => o.trim())).size !== 4 || q.options.some((o) => !o.trim())) errors.push(`Q${n}: options must be 4 distinct, non-empty strings`);
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) errors.push(`Q${n}: answer must be 0-3`);
      if (!q.explanation?.trim() || /\n/.test(q.explanation) || q.explanation.length > 220) errors.push(`Q${n}: explanation must be one line (1-220 chars)`);
      if (!["concept", "output", "bug"].includes(q.kind)) errors.push(`Q${n}: kind must be concept / output / bug`);
    });
    const kinds = new Set(qs.map((q) => q.kind));
    if (want === 5 && kinds.size < 3) errors.push("5-question test must mix concept, output and bug questions");
    if (want === 3 && kinds.size < 2) errors.push("3-question test must mix at least two question kinds");
    if (qs.length > 1 && new Set(qs.map((q) => q.answer)).size === 1) errors.push("every answer is the same option");
  }

  // --- practice problems
  if (l.practical === null || l.practical === undefined) errors.push("manifest: set practical true/false");
  if (l.practical) {
    if (!practice) errors.push("practical topic has no .practice.md");
    else {
      const ph = headings(practice).filter((h) => h.level === 3);
      if (ph.length !== 2) errors.push(`practice has ${ph.length} problems, expected 2`);
      if (!/^Easy:/.test(ph[0]?.text ?? "") || !/^Medium:/.test(ph[1]?.text ?? "")) errors.push('practice problems must be "Easy: ..." then "Medium: ..."');
      for (const chunk of practice.split(/\n(?=### )/).filter((c) => c.startsWith("### "))) {
        const name = chunk.split("\n")[0].slice(4);
        if (!/^>\s*\*\*Hint:\*\*/m.test(chunk)) errors.push(`"${name}": no > **Hint:**`);
        if (!/^\*\*Answer:\*\*/m.test(chunk)) errors.push(`"${name}": no **Answer:**`);
        if (!/```(java|xml|properties|yaml)/.test(chunk)) errors.push(`"${name}": no solution code`);
      }
      for (const f of splitFences(practice).fences) {
        if (!FENCE_LANGS.has(f.lang)) errors.push(`practice code fence has language "${f.lang || "(none)"}"`);
        if (f.lang === "text" && f.body.some((x) => [...x].length > MAX_TEXT_LINE)) errors.push(`practice text block has lines over ${MAX_TEXT_LINE} chars (scrolls on phones)`);
      }
    }
  } else if (practice) warnings.push("theory topic has a .practice.md (it will still be published)");

  // --- FAQ
  const faq = section(body, "Frequently Asked Questions");
  if (!faq) errors.push('no "Frequently Asked Questions" section');
  else {
    const qs = headings(faq).filter((h) => h.level === 3);
    if (qs.length < 3 || qs.length > 4) errors.push(`FAQ has ${qs.length} questions, expected 3-4`);
    for (const q of qs) if (!q.text.endsWith("?")) errors.push(`FAQ question "${q.text}" should end with "?"`);
  }

  // --- related topics + internal links
  const related = section(body, "Related Topics");
  if (!related) errors.push('no "Related Topics" section');
  else {
    const rel = internalLinks(related);
    if (rel.length < 2 || rel.length > 4) errors.push(`Related Topics has ${rel.length} links, expected 2-4`);
    const relSlugs = rel.filter((h) => h.startsWith(coursePath)).map((h) => h.slice(coursePath.length));
    if (JSON.stringify(relSlugs) !== JSON.stringify(l.related)) errors.push("Related Topics links differ from manifest.related");
  }
  for (const href of [...internalLinks(body), ...(practice ? internalLinks(practice) : [])]) {
    if (href.startsWith(coursePath)) {
      const target = href.slice(coursePath.length).replace(/[#?].*$/, "");
      const t = bySlug.get(target);
      if (!t) errors.push(`broken link ${href}`);
      else if (target === l.slug) errors.push("links to itself");
      else if (t.status !== "written") warnings.push(`link to not-yet-written topic ${target}`);
    } else if (href.startsWith("/learning/")) warnings.push(`link outside this course not verified offline: ${href}`);
    else errors.push(`unexpected internal link ${href}`);
  }

  // --- SEO description
  const d = l.description ?? "";
  if (d.length < MIN_DESC || d.length > MAX_DESC) errors.push(`description is ${d.length} chars, expected ${MIN_DESC}-${MAX_DESC}`);
  if (/\s{2,}|\n/.test(d)) errors.push("description has double spaces or line breaks");

  return { words, practiceWords, errors, warnings, diagrams: diagrams.length };
}

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------
const targets = manifest.lessons.filter((l) => l.status === "written" && (batchArg === null || l.batch === batchArg));
console.log(`Spring Boot lessons: ${manifest.lessons.filter((l) => l.status === "written").length} written / ${manifest.lessons.length} total` + (batchArg !== null ? ` (checking batch ${batchArg})` : ""));
console.log("");
console.log("status  words  practice  diagrams  slug");
for (const l of targets) {
  const r = checkLesson(l);
  const ok = r.errors.length === 0;
  if (!ok) failed += 1;
  warned += r.warnings.length;
  console.log(`${ok ? "PASS" : "FAIL"}    ${String(r.words).padStart(5)}  ${String(r.practiceWords).padStart(8)}  ${String(r.diagrams).padStart(8)}  ${l.slug}`);
  for (const e of r.errors) console.log(`          x ${e}`);
  for (const w of r.warnings) console.log(`          ! ${w}`);
}
if (globalErrors.length) {
  console.log("\nManifest:");
  for (const e of globalErrors) console.log(`          x ${e}`);
}
if (targets.length === 0) console.log("(no written lessons in scope)");
console.log(`\n${targets.length - failed} passed, ${failed} failed, ${warned} warning(s)${globalErrors.length ? `, ${globalErrors.length} manifest error(s)` : ""}`);
process.exit(failed || globalErrors.length ? 1 : 0);
