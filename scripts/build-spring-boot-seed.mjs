#!/usr/bin/env node
/**
 * Builds the SQL for one batch of the Spring Boot course from content/spring-boot/.
 *
 *   node scripts/build-spring-boot-seed.mjs --batch 1
 *
 * Writes (numbers come from manifest.batches[N]):
 *   mobile-app/supabase/migrations/<mobile>_seed_spring_boot_tutorial_batchNN.sql
 *   admin-panel/supabase/migrations/<admin>_seed_spring_boot_tutorial_batchNN.sql   (byte-identical body)
 *   mobile-app/supabase/rollbacks/<mobile>_seed_spring_boot_tutorial_batchNN_rollback.sql
 * and appends the twin pair to mobile-app/supabase/tests/harness/chain_order.txt.
 *
 * Refuses to build unless scripts/verify-spring-boot-lessons.mjs passes for the batch.
 * Content only: no schema, RLS, function or index changes. Every statement is
 * idempotent, so a file can be applied twice with the same result.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "content", "spring-boot");
const args = process.argv.slice(2);
const batch = Number(args[args.indexOf("--batch") + 1]);
if (!args.includes("--batch") || !Number.isInteger(batch) || batch < 1) {
  console.error("usage: node scripts/build-spring-boot-seed.mjs --batch <n>");
  process.exit(2);
}

// ---- gate on the content checks ------------------------------------------
try {
  execFileSync(process.execPath, [path.join(ROOT, "scripts", "verify-spring-boot-lessons.mjs"), "--batch", String(batch)], { stdio: "inherit" });
} catch {
  console.error(`\nverify failed for batch ${batch}: no SQL written.`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(path.join(DIR, "manifest.json"), "utf8"));
const nums = manifest.batches?.[String(batch)];
if (!nums?.mobile || !nums?.admin) throw new Error(`manifest.batches["${batch}"] needs { mobile, admin } migration numbers`);
const { course } = manifest;
const lessons = manifest.lessons.filter((l) => l.batch === batch && l.status === "written");
if (lessons.length === 0) throw new Error(`no written lessons in batch ${batch}`);
const groupIndex = new Map(manifest.groups.map((g, i) => [g.slug, i]));
const groupOrder = (slug) => manifest.lessons.filter((l) => l.group === slug);
const createsGrid = batch === 1;
// A group is "introduced" by the batch that ships its first written lesson.
const earlier = new Set(manifest.lessons.filter((l) => l.status === "written" && l.batch !== null && l.batch < batch).map((l) => l.group));
const groupsHere = [...new Set(lessons.map((l) => l.group))];
const introducedGroups = groupsHere.filter((g) => !earlier.has(g));

const NN = String(batch).padStart(2, "0");
const stem = `seed_spring_boot_tutorial_batch${NN}`;
const mobileName = `${nums.mobile}_${stem}.sql`;
const adminName = `${nums.admin}_${stem}.sql`;
const mobileFile = path.join(ROOT, "mobile-app", "supabase", "migrations", mobileName);
const adminFile = path.join(ROOT, "admin-panel", "supabase", "migrations", adminName);
const rollbackFile = path.join(ROOT, "mobile-app", "supabase", "rollbacks", `${nums.mobile}_${stem}_rollback.sql`);
for (const [dir, num, name] of [
  [path.dirname(mobileFile), nums.mobile, mobileName],
  [path.dirname(adminFile), nums.admin, adminName],
]) {
  const clash = fs.readdirSync(dir).find((f) => f.startsWith(`${num}_`) && f !== name);
  if (clash) throw new Error(`migration number ${num} is already used by ${clash}`);
}

// ---- SQL literal helpers ---------------------------------------------------
let tagN = 0;
function q(text) {
  const s = String(text);
  let tag;
  do tag = `$sb${++tagN}$`;
  while (s.includes(tag));
  return `${tag}${s}${tag}`;
}
const read = (slug, suffix) => {
  const p = path.join(DIR, "lessons", `${slug}${suffix}`);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n").replace(/\n+$/, "") : null;
};
const ref = (l) => `${l.group}/${l.slug}`;
const testId = (l) => `pt-sb-${l.slug}`;
const EASY_GROUPS = new Set(["getting-started", "core-concepts", "configuration"]);
const difficulty = (l) => l.difficulty ?? (EASY_GROUPS.has(l.group) ? "Easy" : "Medium");
const TK = course.topicSourceKind;
const GRID = `select id, show_on_website, show_on_mobile from public.learning_grids where lower(slug) = '${course.slug}' and source_kind = '${course.sourceKind}' and source_ref = '${course.sourceRef}'`;
const TOPIC = (l) => `select id from public.learning_topics where source_kind = '${TK}' and source_ref = ${q(ref(l))}`;

// ---- body --------------------------------------------------------------------
const out = [];
const w = (s = "") => out.push(s);
const slugs = lessons.map((l) => l.slug);
const practical = lessons.filter((l) => l.practical);
const questionTotal = lessons.reduce((n, l) => n + JSON.parse(read(l.slug, ".quiz.json")).questions.length, 0);

w("-- ============================================================================");
w(`-- BODY — Learning ▸ ${course.name} ▸ batch ${NN} (byte-identical in both twins)`);
w("-- ============================================================================");
w(`-- Generated by scripts/build-spring-boot-seed.mjs from content/spring-boot/. Edit the`);
w(`-- Markdown / manifest there and regenerate; do not hand-edit this file.`);
w("--");
w(`-- Topics in this batch (${lessons.length}): ${slugs.join(", ")}`);
w(`-- Rows: ${lessons.length} topics, ${lessons.length} lesson blocks, ${practical.length} Practice Problems blocks,`);
w(`--       ${lessons.length} topic Mock Tests with ${questionTotal} MCQs.`);
w("--");
w("-- Content only: no schema, RLS, function or index change. Uses the existing");
w("-- learning_* tables (0042/019, 0044/021) and topic practice (0048/025).");
if (createsGrid) {
  w(`-- Creates the '${course.slug}' grid HIDDEN (show_on_website = false,`);
  w("-- show_on_mobile = false). Re-running never changes an existing grid, so the");
  w("-- visibility an admin sets later is kept.");
}
w("-- IDEMPOTENT: every row is keyed (grid slug, section slug, topic source_ref,");
w("-- content metadata, test / question ids). Applying the file twice gives the");
w("-- same rows. Re-running refreshes changed text only (unchanged rows are not");
w("-- touched, not even updated_at) and never touches publish state, premium flags");
w("-- or visibility.");
w(`-- Rollback: mobile-app/supabase/rollbacks/${path.basename(rollbackFile)}`);
w("-- ----------------------------------------------------------------------------");
w();
w("-- ---- guard ------------------------------------------------------------------");
w("do $guard$");
w("begin");
w("  if to_regclass('public.learning_grids') is null or to_regprocedure('public.learning_slugify(text)') is null then");
w(`    raise exception '${nums.mobile}/${nums.admin}: learning_* not found. Apply 0042/019, 0043/020 and 0044/021 first.';`);
w("  end if;");
w("  if to_regprocedure('public.learning_topic_practice(text, text, text)') is null then");
w(`    raise exception '${nums.mobile}/${nums.admin}: topic practice not found. Apply 0048_topic_practice.sql (admin 025) first.';`);
w("  end if;");
w("  if exists (");
w(`    select 1 from public.learning_grids where lower(slug) = '${course.slug}'`);
w(`      and (source_kind is distinct from '${course.sourceKind}' or source_ref is distinct from '${course.sourceRef}')`);
w("  ) then");
w(`    raise exception '${nums.mobile}/${nums.admin}: a grid with slug ${course.slug} exists that this seed did not create. Refusing to touch it.';`);
w("  end if;");
if (!createsGrid) {
  w(`  if not exists (${GRID}) then`);
  w(`    raise exception '${nums.mobile}/${nums.admin}: ${course.name} grid not found. Apply batch 01 first.';`);
  w("  end if;");
}
w("end");
w("$guard$;");
w();

if (createsGrid) {
  w("-- ===========================================================================");
  w("-- GRID — created hidden; an existing grid is left exactly as it is.");
  w("-- ===========================================================================");
  w("insert into public.learning_grids");
  w("  (name, slug, description, icon, grid_type, sort_order,");
  w("   status, show_on_website, show_on_mobile, is_featured, source_kind, source_ref)");
  w("values");
  w(`  (${q(course.name)}, '${course.slug}',`);
  w(`   ${q(course.description)},`);
  w(`   ${q(course.icon)}, 'content', ${course.sortOrder}, 'published', false, false, false,`);
  w(`   '${course.sourceKind}', '${course.sourceRef}')`);
  w("on conflict (lower(slug)) do nothing;");
  w();
}

w("-- ===========================================================================");
w("-- SECTIONS (course groups) — insert or refresh name / description / order.");
w("-- ===========================================================================");
for (const gslug of groupsHere) {
  const g = manifest.groups.find((x) => x.slug === gslug);
  w(`with g as (${GRID})`);
  w("insert into public.learning_sections");
  w("  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)");
  w(`select g.id, ${q(g.name)}, '${g.slug}', ${q(g.description)}, ${(groupIndex.get(gslug) + 1) * 10}, 'published', true, true`);
  w("from g");
  w("on conflict (grid_id, lower(slug)) do update set");
  w("  name = excluded.name, description = excluded.description,");
  w("  sort_order = excluded.sort_order, updated_at = now()");
  w("where (learning_sections.name, learning_sections.description, learning_sections.sort_order)");
  w("  is distinct from (excluded.name, excluded.description, excluded.sort_order);");
  w();
}

for (const l of lessons) {
  const body = read(l.slug, ".md");
  const practice = l.practical ? read(l.slug, ".practice.md") : null;
  const quiz = JSON.parse(read(l.slug, ".quiz.json")).questions;
  const order = groupOrder(l.group).findIndex((x) => x.slug === l.slug) + 1;
  const g = manifest.groups.find((x) => x.slug === l.group);

  w("-- ===========================================================================");
  w(`-- ${g.name} ▸ ${l.title}`);
  w("-- ===========================================================================");
  w(`with g as (${GRID}),`);
  w(`sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = '${l.group}')`);
  w("insert into public.learning_topics");
  w("  (grid_id, section_id, title, slug, short_description, sort_order,");
  w("   is_premium, status, show_on_website, show_on_mobile, source_kind, source_ref)");
  w(`select g.id, sec.id, ${q(l.title)}, '${l.slug}',`);
  w(`  ${q(l.description)},`);
  w(`  ${order * 10}, false, 'published', true, true, '${TK}', ${q(ref(l))}`);
  w("from g, sec");
  w("on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null");
  w("do update set");
  w("  title = excluded.title, short_description = excluded.short_description,");
  w("  section_id = excluded.section_id, sort_order = excluded.sort_order, updated_at = now()");
  w("where (learning_topics.title, learning_topics.short_description, learning_topics.section_id, learning_topics.sort_order)");
  w("  is distinct from (excluded.title, excluded.short_description, excluded.section_id, excluded.sort_order);");
  w();

  const blocks = [["lesson", "", body, 0, "article"]];
  if (practice) blocks.push(["practice", "Practice Problems", practice, 1, "exercise"]);
  for (const [block, heading, text, sort, type] of blocks) {
    w(`-- ${l.title} — ${block} block`);
    w(`with src(body) as (values (${q(text)})),`);
    w(`tp as (${TOPIC(l)}),`);
    w("upd as (");
    w(`  update public.learning_contents c set heading = ${q(heading)}, body = src.body, content_format = 'markdown', sort_order = ${sort}, updated_at = now()`);
    w("  from src, tp");
    w(`  where c.topic_id = tp.id and c.metadata ->> 'source' = 'spring_boot_seed' and c.metadata ->> 'block' = '${block}'`);
    w(`    and (c.heading, c.body, c.content_format, c.sort_order) is distinct from (${q(heading)}, src.body, 'markdown', ${sort})`);
    w("  returning c.id");
    w(")");
    w("insert into public.learning_contents (topic_id, heading, body, content_format, metadata, status, sort_order)");
    w(`select tp.id, ${q(heading)}, src.body, 'markdown',`);
    w(`  jsonb_build_object('source', 'spring_boot_seed', 'block', '${block}', 'content_type', '${type}'), 'published', ${sort}`);
    w("from src, tp");
    w("where not exists (select 1 from upd)");
    w(`  and not exists (select 1 from public.learning_contents c where c.topic_id = tp.id and c.metadata ->> 'source' = 'spring_boot_seed' and c.metadata ->> 'block' = '${block}');`);
    w();
  }
  if (!practice) {
    w(`-- ${l.title} has no practice problems: remove a stale block from an earlier run`);
    w(`delete from public.learning_contents c using (${TOPIC(l)}) tp`);
    w("where c.topic_id = tp.id and c.metadata ->> 'source' = 'spring_boot_seed' and c.metadata ->> 'block' = 'practice';");
    w();
  }

  const n = quiz.length;
  w(`-- ${l.title} — Mock Test (${n} MCQs / ${n} min)`);
  w(`with g as (${GRID}),`);
  w(`tp as (${TOPIC(l)})`);
  w("insert into public.practice_tests");
  w("  (id, title, category, question_count, duration_minutes, description,");
  w("   total_marks, pass_marks, is_published, difficulty,");
  w("   learning_grid_id, learning_topic_id, status, is_premium,");
  w("   negative_marking, instructions, show_on_website, show_on_mobile)");
  w("select");
  w(`  '${testId(l)}', ${q(`${l.title} - Quick Test`)}, 'aptitude', ${n}, ${n},`);
  w(`  ${q(`${n} questions to check what you learned in ${l.title}.`)},`);
  w(`  ${n}, ${Math.ceil(n * 0.4)}, true, '${difficulty(l)}',`);
  w("  g.id, tp.id, 'published', false,");
  w(`  0, ${q(`Answer all ${n} questions. Each carries 1 mark. No negative marking. You have ${n} minutes to complete this test.`)},`);
  w("  g.show_on_website, g.show_on_mobile");
  w("from g, tp");
  w("on conflict (id) do update set");
  w("  title = excluded.title, question_count = excluded.question_count,");
  w("  duration_minutes = excluded.duration_minutes, description = excluded.description,");
  w("  total_marks = excluded.total_marks, pass_marks = excluded.pass_marks,");
  w("  difficulty = excluded.difficulty, instructions = excluded.instructions,");
  w("  learning_grid_id = excluded.learning_grid_id, learning_topic_id = excluded.learning_topic_id,");
  w("  updated_at = now()");
  w("where (practice_tests.title, practice_tests.question_count, practice_tests.duration_minutes, practice_tests.description,");
  w("       practice_tests.total_marks, practice_tests.pass_marks, practice_tests.difficulty, practice_tests.instructions,");
  w("       practice_tests.learning_grid_id, practice_tests.learning_topic_id)");
  w("  is distinct from (excluded.title, excluded.question_count, excluded.duration_minutes, excluded.description,");
  w("       excluded.total_marks, excluded.pass_marks, excluded.difficulty, excluded.instructions,");
  w("       excluded.learning_grid_id, excluded.learning_topic_id);");
  w();
  w("insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)");
  w("values");
  quiz.forEach((qq, i) => {
    w(`  ('tq-sb-${l.slug}-${i + 1}', '${testId(l)}',`);
    w(`   ${q(qq.question)},`);
    w(`   ${q(JSON.stringify(qq.options))}::jsonb,`);
    w(`   ${qq.answer}, ${q(qq.explanation)}, 1, ${i})${i === n - 1 ? "" : ","}`);
  });
  w("on conflict (id) do update set");
  w("  question_text = excluded.question_text, options = excluded.options,");
  w("  correct_index = excluded.correct_index, explanation = excluded.explanation,");
  w("  marks = excluded.marks, sort_order = excluded.sort_order");
  w("where (test_questions.question_text, test_questions.options, test_questions.correct_index,");
  w("       test_questions.explanation, test_questions.marks, test_questions.sort_order)");
  w("  is distinct from (excluded.question_text, excluded.options, excluded.correct_index,");
  w("       excluded.explanation, excluded.marks, excluded.sort_order);");
  w(`delete from public.test_questions where test_id = '${testId(l)}'`);
  w(`  and id <> all (array[${quiz.map((_, i) => `'tq-sb-${l.slug}-${i + 1}'`).join(", ")}]);`);
  w();
}

// ---- validation --------------------------------------------------------------
const refList = lessons.map((l) => q(ref(l))).join(", ");
const testList = lessons.map((l) => `'${testId(l)}'`).join(", ");
w("-- ===========================================================================");
w("-- VALIDATION — fail loudly if this batch did not land exactly.");
w("-- ===========================================================================");
w("do $val$");
w("declare");
w("  v_topics int; v_lessons int; v_practice int; v_tests int; v_questions int; v_web boolean; v_mob boolean;");
w("begin");
w(`  select count(*) into v_topics from public.learning_topics where source_kind = '${TK}' and source_ref in (${refList});`);
w(`  if v_topics <> ${lessons.length} then raise exception 'validation: expected ${lessons.length} topics, found %', v_topics; end if;`);
w("  select count(*) filter (where c.metadata ->> 'block' = 'lesson'), count(*) filter (where c.metadata ->> 'block' = 'practice')");
w("    into v_lessons, v_practice");
w("    from public.learning_contents c join public.learning_topics t on t.id = c.topic_id");
w(`   where c.metadata ->> 'source' = 'spring_boot_seed' and t.source_kind = '${TK}' and t.source_ref in (${refList});`);
w(`  if v_lessons <> ${lessons.length} then raise exception 'validation: expected ${lessons.length} lesson blocks, found %', v_lessons; end if;`);
w(`  if v_practice <> ${practical.length} then raise exception 'validation: expected ${practical.length} practice blocks, found %', v_practice; end if;`);
w(`  select count(*) into v_tests from public.practice_tests where id in (${testList}) and learning_topic_id is not null;`);
w(`  if v_tests <> ${lessons.length} then raise exception 'validation: expected ${lessons.length} linked mock tests, found %', v_tests; end if;`);
w(`  select count(*) into v_questions from public.test_questions where test_id in (${testList});`);
w(`  if v_questions <> ${questionTotal} then raise exception 'validation: expected ${questionTotal} MCQs, found %', v_questions; end if;`);
w(`  select show_on_website, show_on_mobile into v_web, v_mob from (${GRID}) g;`);
w(`  raise notice '${nums.mobile}/${nums.admin} OK: ${course.name} batch ${NN}: % topics, % lesson blocks, % practice blocks, % tests, % MCQs. Grid visible on website=%, mobile=%.',`);
w("    v_topics, v_lessons, v_practice, v_tests, v_questions, v_web, v_mob;");
w("end");
w("$val$;");
w();
w("notify pgrst, 'reload schema';");

const body = out.join("\n") + "\n";
const header = (self, twin) =>
  [`-- ${self}`, "-- CANONICAL PAIR — the body below this line is byte-identical to its twin", `-- twin: ${twin} ; apply either once (re-running is safe).`].join("\n") + "\n";
const mobileRel = `mobile-app/supabase/migrations/${mobileName}`;
const adminRel = `admin-panel/supabase/migrations/${adminName}`;
fs.writeFileSync(mobileFile, header(mobileRel, adminRel) + body);
fs.writeFileSync(adminFile, header(adminRel, mobileRel) + body);

// ---- rollback ------------------------------------------------------------------
const rb = [];
const r = (s = "") => rb.push(s);
r(`-- mobile-app/supabase/rollbacks/${path.basename(rollbackFile)}`);
r(`-- ROLLBACK for ${mobileRel} (twin ${adminRel}).`);
r("-- Generated by scripts/build-spring-boot-seed.mjs. NOT a migration: this folder is outside");
r("-- supabase/migrations, so the CLI never applies it. Run it by hand, once, in one transaction.");
r("--");
if (createsGrid) {
  r(`-- Batch 01 created the course, so this removes the WHOLE ${course.name} course: every topic`);
  r("-- in its grid (with their content blocks), their mock tests and MCQs, the sections and the grid.");
  r("-- Roll back later batches first (highest number first).");
} else {
  r(`-- Removes only the ${lessons.length} topic(s) of batch ${NN} with their content blocks, and every mock test`);
  r("-- attached to those topics (the seeded ones and any an admin added later) with its MCQs; then any of");
  r(`-- these now-empty sections this batch introduced: ${introducedGroups.join(", ") || "(none)"}.`);
}
r("-- Deleting a mock test also deletes students' attempts on it, and deleting a topic deletes");
r("-- its bookmarks; the counts are printed before anything is removed. Nothing outside this");
r("-- course is touched. Safe to run twice: the second run finds nothing and changes nothing.");
r("-- ----------------------------------------------------------------------------");
r("do $rollback$");
r("declare");
r("  v_grid uuid; v_topics uuid[]; v_tests text[]; v_attempts int; v_bookmarks int; v_n int;");
r("begin");
r(`  select id into v_grid from (${GRID}) g;`);
r("  if v_grid is null then");
r(`    raise notice 'rollback: ${course.name} grid not found, nothing to do.';`);
r("    return;");
r("  end if;");
if (createsGrid) r("  select coalesce(array_agg(id), '{}') into v_topics from public.learning_topics where grid_id = v_grid;");
else r(`  select coalesce(array_agg(id), '{}') into v_topics from public.learning_topics where grid_id = v_grid and source_kind = '${TK}' and source_ref in (${refList});`);
r("  select coalesce(array_agg(id), '{}') into v_tests from public.practice_tests");
r(`   where learning_topic_id = any (v_topics) or id in (${testList})${createsGrid ? " or learning_grid_id = v_grid or learning_grid_id_scope = v_grid" : ""};`);
r("  select count(*) into v_attempts from public.test_attempts where test_id = any (v_tests);");
r("  select count(*) into v_bookmarks from public.learning_bookmarks where topic_id = any (v_topics);");
r("  raise notice 'rollback: removing % topic(s), % mock test(s); this also deletes % test attempt(s) and % bookmark(s).',");
r("    cardinality(v_topics), cardinality(v_tests), v_attempts, v_bookmarks;");
r("  delete from public.practice_tests where id = any (v_tests);          -- cascades test_questions, test_attempts");
r("  delete from public.learning_topics where id = any (v_topics);        -- cascades learning_contents, learning_bookmarks");
if (createsGrid) {
  r("  delete from public.learning_sections where grid_id = v_grid;");
  r("  delete from public.learning_grids where id = v_grid;");
  r(`  raise notice 'rollback: ${course.name} removed.';`);
} else if (introducedGroups.length) {
  r("  delete from public.learning_sections s where s.grid_id = v_grid");
  r(`    and s.slug in (${introducedGroups.map((g) => `'${g}'`).join(", ")})`);
  r("    and not exists (select 1 from public.learning_topics t where t.section_id = s.id);");
  r("  get diagnostics v_n = row_count;");
  r("  raise notice 'rollback: removed % empty section(s).', v_n;");
}
r("end");
r("$rollback$;");
r();
r("notify pgrst, 'reload schema';");
fs.mkdirSync(path.dirname(rollbackFile), { recursive: true });
fs.writeFileSync(rollbackFile, rb.join("\n") + "\n");

// ---- chain order ----------------------------------------------------------------
const chain = path.join(ROOT, "mobile-app", "supabase", "tests", "harness", "chain_order.txt");
const chainText = fs.readFileSync(chain, "utf8");
const lines = [`mobile ${mobileName}`, `admin ${adminName}`].filter((x) => !chainText.split("\n").includes(x));
if (lines.length) fs.appendFileSync(chain, (chainText.endsWith("\n") ? "" : "\n") + lines.join("\n") + "\n");

const kb = (f) => `${(fs.statSync(f).size / 1024).toFixed(1)} KB`;
console.log(`\nbatch ${NN}: ${lessons.length} topic(s), ${practical.length} practice block(s), ${questionTotal} MCQs`);
console.log(`  ${mobileRel} (${kb(mobileFile)})`);
console.log(`  ${adminRel} (${kb(adminFile)})`);
console.log(`  mobile-app/supabase/rollbacks/${path.basename(rollbackFile)} (${kb(rollbackFile)})`);
console.log(lines.length ? `  chain_order.txt: appended ${lines.length} line(s)` : "  chain_order.txt: already listed");
