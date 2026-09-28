#!/usr/bin/env node
/**
 * Builds the SQL for one batch of the Java Tutorials lesson rewrite from content/java/.
 *
 *   node scripts/build-java-seed.mjs --batch 1
 *
 * Writes (numbers come from manifest.batches[N]):
 *   mobile-app/supabase/migrations/<mobile>_java_lesson_rewrite_batchNN.sql
 *   admin-panel/supabase/migrations/<admin>_java_lesson_rewrite_batchNN.sql   (byte-identical body)
 *   mobile-app/supabase/rollbacks/<mobile>_java_lesson_rewrite_batchNN_rollback.sql
 *   mobile-app/supabase/checks/java_lesson_rewrite_batchNN_precheck.sql       (read-only)
 * and appends the twin pair to mobile-app/supabase/tests/harness/chain_order.txt.
 *
 * Refuses to build unless scripts/verify-java-lessons.mjs passes for the batch.
 *
 * The Java topics already exist (seeded by 0047/024). This batch never inserts
 * or deletes a topic and never changes a topic id, slug, title, section,
 * sort order or publish state. It:
 *   - replaces the body of each topic's 'java_tutorial_seed' lesson block IN PLACE,
 *     but only when that body is still the original 0047 text (or already the new
 *     text); an admin-edited body makes the whole file stop with an error;
 *   - replaces the topic's short_description and bumps learning_topics.updated_at
 *     (the sitemap's lastmod) when anything about the topic changed;
 *   - adds a 'Practice Problems' block (metadata.source 'java_practice_seed', the
 *     shape 0070/042 uses) and a topic mock test pt-java-<slug>, where the
 *     manifest asks for them.
 * Every statement is idempotent: re-running the file changes nothing.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "content", "java");
const args = process.argv.slice(2);
const batch = Number(args[args.indexOf("--batch") + 1]);
if (!args.includes("--batch") || !Number.isInteger(batch) || batch < 1) {
  console.error("usage: node scripts/build-java-seed.mjs --batch <n>");
  process.exit(2);
}

// ---- gate on the content checks ------------------------------------------
try {
  execFileSync(process.execPath, [path.join(ROOT, "scripts", "verify-java-lessons.mjs"), "--batch", String(batch)], { stdio: "inherit" });
} catch {
  console.error(`\nverify failed for batch ${batch}: no SQL written.`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(path.join(DIR, "manifest.json"), "utf8"));
const nums = manifest.batches?.[String(batch)];
if (!nums?.mobile || !nums?.admin) throw new Error(`manifest.batches["${batch}"] needs { mobile, admin } migration numbers`);
const { course } = manifest;
const lessons = manifest.lessons.filter((l) => l.batch === batch);
if (lessons.length === 0) throw new Error(`no lessons in batch ${batch}`);

// ---- the original 0047 text of each topic (the guard and the rollback need it) ----
const seedSql = fs.readFileSync(path.join(ROOT, course.seedMigration), "utf8");
const original = new Map();
for (const m of seedSql.matchAll(/\$sl\$([^$]+)\$sl\$, \$sd\$([\s\S]*?)\$sd\$,[\s\S]*?\$sr\$([^$]+)\$sr\$[\s\S]*?select up_topic\.id, '', \$md\$([\s\S]*?)\$md\$/g)) {
  original.set(m[1], { description: m[2], ref: m[3], body: m[4] });
}
for (const l of lessons) {
  const o = original.get(l.slug);
  if (!o) throw new Error(`${l.slug}: not found in ${course.seedMigration}`);
  if (o.ref !== `${l.section}/${l.slug}`) throw new Error(`${l.slug}: seed source_ref is ${o.ref}, manifest says ${l.section}/${l.slug}`);
}

const NN = String(batch).padStart(2, "0");
const stem = `java_lesson_rewrite_batch${NN}`;
const mobileName = `${nums.mobile}_${stem}.sql`;
const adminName = `${nums.admin}_${stem}.sql`;
const mobileFile = path.join(ROOT, "mobile-app", "supabase", "migrations", mobileName);
const adminFile = path.join(ROOT, "admin-panel", "supabase", "migrations", adminName);
const rollbackFile = path.join(ROOT, "mobile-app", "supabase", "rollbacks", `${nums.mobile}_${stem}_rollback.sql`);
const checkFile = path.join(ROOT, "mobile-app", "supabase", "checks", `${stem}_precheck.sql`);
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
  do tag = `$jr${++tagN}$`;
  while (s.includes(tag));
  return `${tag}${s}${tag}`;
}
const md5 = (s) => crypto.createHash("md5").update(s, "utf8").digest("hex");
const read = (slug, suffix) => {
  const p = path.join(DIR, "lessons", `${slug}${suffix}`);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n").replace(/\n+$/, "") : null;
};
const ref = (l) => `${l.section}/${l.slug}`;
const testId = (l) => `pt-java-${l.slug}`;
const qid = (l, i) => `tq-java-${l.slug}-${i + 1}`;
const TK = course.topicSourceKind;
const CS = course.contentSource;
const PS = course.practiceSource;
const ORIGIN = "java_lesson_rewrite";
// By slug only, like 0070/042: the live grid existed before 0047 seeded it, so its source_kind/source_ref are not guaranteed.
const GRID = `select id, show_on_website, show_on_mobile from public.learning_grids where lower(slug) = '${course.slug}'`;
const TOPIC = (l) => `select id from public.learning_topics where source_kind = '${TK}' and source_ref = '${ref(l)}'`;

const data = lessons.map((l) => {
  const meta = JSON.parse(read(l.slug, ".meta.json"));
  return {
    l,
    body: read(l.slug, ".md"),
    description: meta.description,
    practice: l.practice ? read(l.slug, ".practice.md") : null,
    quiz: l.quiz ? JSON.parse(read(l.slug, ".quiz.json")).questions : null,
    old: original.get(l.slug),
  };
});
const withPractice = data.filter((d) => d.practice);
const withQuiz = data.filter((d) => d.quiz);
const questionTotal = withQuiz.reduce((n, d) => n + d.quiz.length, 0);
const refList = lessons.map((l) => `'${ref(l)}'`).join(", ");
const refsOf = (ds) => ds.map((d) => `'${ref(d.l)}'`).join(", ");
const testList = withQuiz.map((d) => `'${testId(d.l)}'`).join(", ");

// ---- body --------------------------------------------------------------------
const out = [];
const w = (s = "") => out.push(s);

w("-- ============================================================================");
w(`-- BODY — Learning ▸ ${course.name} ▸ lesson rewrite batch ${NN} (byte-identical in both twins)`);
w("-- ============================================================================");
w("-- Generated by scripts/build-java-seed.mjs from content/java/. Edit the Markdown /");
w("-- manifest there and regenerate; do not hand-edit this file.");
w("--");
w(`-- Topics (${lessons.length}): ${lessons.map((l) => l.slug).join(", ")}`);
w(`-- Changes: ${lessons.length} lesson bodies + short_descriptions rewritten in place,`);
w(`--          ${withPractice.length} Practice Problems blocks added, ${withQuiz.length} topic Mock Tests with ${questionTotal} MCQs added.`);
w("--");
w("-- Content only: no schema, RLS, function or index change. Topic ids, slugs, titles,");
w("-- sections, sort orders, premium flags and publish state are never touched.");
w(`-- GUARDED: every lesson body must still be the original ${path.basename(course.seedMigration)} text (or`);
w("-- already this batch's text). If an admin has edited one, the file stops with an");
w("-- error naming the topic and nothing is changed.");
w("-- IDEMPOTENT: re-running changes nothing (not even updated_at).");
w("-- The topic's updated_at is bumped when its text changes; that is the sitemap lastmod.");
w(`-- Read-only check first: mobile-app/supabase/checks/${path.basename(checkFile)}`);
w(`-- Rollback: mobile-app/supabase/rollbacks/${path.basename(rollbackFile)}`);
w("-- ----------------------------------------------------------------------------");
w();
w("-- ---- guard ------------------------------------------------------------------");
w("do $guard$");
w("declare");
w("  v_bad text;");
w("begin");
w("  if to_regclass('public.learning_contents') is null or to_regprocedure('public.learning_topic_practice(text, text, text)') is null then");
w(`    raise exception '${nums.mobile}/${nums.admin}: learning_* or topic practice not found. Apply 0042-0048 (admin 019-025) first.';`);
w("  end if;");
w(`  if not exists (${GRID}) then`);
w(`    raise exception '${nums.mobile}/${nums.admin}: ${course.name} grid not found. Apply ${path.basename(course.seedMigration)} (admin twin) first.';`);
w("  end if;");
w("  -- each topic exists and has exactly one seeded lesson block");
w("  select string_agg(r, ', ' order by r) into v_bad from (");
w(`    select x.r from unnest(array[${refList}]) as x(r)`);
w("    where (select count(*) from public.learning_contents c join public.learning_topics t on t.id = c.topic_id");
w(`           where t.source_kind = '${TK}' and t.source_ref = x.r and c.metadata ->> 'source' = '${CS}') <> 1`);
w("  ) z;");
w(`  if v_bad is not null then raise exception '${nums.mobile}/${nums.admin}: topic or its lesson block missing or duplicated: %', v_bad; end if;`);
w("  -- each lesson body is still the original seed text or already this batch's text");
w("  select string_agg(t.slug, ', ' order by t.slug) into v_bad");
w("    from public.learning_contents c join public.learning_topics t on t.id = c.topic_id");
w("    join (values");
data.forEach((d, i) => w(`      ('${ref(d.l)}', '${md5(d.old.body)}', '${md5(d.body)}')${i === data.length - 1 ? "" : ","}`));
w("    ) v(ref, old_md5, new_md5) on v.ref = t.source_ref");
w(`   where t.source_kind = '${TK}' and c.metadata ->> 'source' = '${CS}'`);
w("     and md5(c.body) not in (v.old_md5, v.new_md5);");
w(`  if v_bad is not null then raise exception '${nums.mobile}/${nums.admin}: lesson body was edited after the seed, refusing to overwrite: %', v_bad; end if;`);
if (withPractice.length) {
  w("  -- no other Practice Problems block exists on these topics (one per topic, unique index from 0070/042)");
  w("  select string_agg(t.slug, ', ' order by t.slug) into v_bad");
  w("    from public.learning_contents c join public.learning_topics t on t.id = c.topic_id");
  w(`   where t.source_kind = '${TK}' and t.source_ref in (${refsOf(withPractice)})`);
  w(`     and c.metadata ->> 'source' = '${PS}' and c.metadata ->> 'origin' is distinct from '${ORIGIN}';`);
  w(`  if v_bad is not null then raise exception '${nums.mobile}/${nums.admin}: these topics already have a Practice Problems block: %', v_bad; end if;`);
}
if (withQuiz.length) {
  w("  -- a test id this batch uses is not attached to some other topic");
  w("  select string_agg(p.id, ', ' order by p.id) into v_bad");
  w("    from public.practice_tests p join (values");
  withQuiz.forEach((d, i) => w(`      ('${testId(d.l)}', '${ref(d.l)}')${i === withQuiz.length - 1 ? "" : ","}`));
  w("    ) v(test_id, ref) on v.test_id = p.id");
  w("   where p.learning_topic_id is distinct from");
  w(`         (select t.id from public.learning_topics t where t.source_kind = '${TK}' and t.source_ref = v.ref);`);
  w(`  if v_bad is not null then raise exception '${nums.mobile}/${nums.admin}: test id already used by another topic: %', v_bad; end if;`);
}
w("end");
w("$guard$;");
w();

for (const d of data) {
  const { l } = d;
  w("-- ===========================================================================");
  w(`-- ${l.title}  (${ref(l)})`);
  w("-- ===========================================================================");
  w(`with src(body, descr) as (values (${q(d.body)},`);
  w(`  ${q(d.description)})),`);
  w(`tp as (${TOPIC(l)}),`);
  w("upd as (");
  w("  update public.learning_contents c set body = src.body, content_format = 'markdown', updated_at = now()");
  w("  from src, tp");
  w(`  where c.topic_id = tp.id and c.metadata ->> 'source' = '${CS}'`);
  w("    and (c.body, c.content_format) is distinct from (src.body, 'markdown')");
  w("  returning c.topic_id");
  w(")");
  w("update public.learning_topics t set short_description = src.descr, updated_at = now()");
  w("from src, tp");
  w("where t.id = tp.id");
  w("  and (t.short_description is distinct from src.descr or exists (select 1 from upd));");
  w();

  if (d.practice) {
    w(`-- ${l.title} — Practice Problems block`);
    w(`with src(body) as (values (${q(d.practice)})),`);
    w(`tp as (${TOPIC(l)}),`);
    w("upd as (");
    w("  update public.learning_contents c set heading = 'Practice Problems', body = src.body, content_format = 'markdown', sort_order = 1, updated_at = now()");
    w("  from src, tp");
    w(`  where c.topic_id = tp.id and c.metadata ->> 'source' = '${PS}' and c.metadata ->> 'origin' = '${ORIGIN}'`);
    w("    and (c.heading, c.body, c.content_format, c.sort_order) is distinct from ('Practice Problems', src.body, 'markdown', 1)");
    w("  returning c.id");
    w(")");
    w("insert into public.learning_contents (topic_id, heading, body, content_format, metadata, status, sort_order)");
    w("select tp.id, 'Practice Problems', src.body, 'markdown',");
    w(`  jsonb_build_object('source', '${PS}', 'content_type', 'exercise', 'origin', '${ORIGIN}'), 'published', 1`);
    w("from src, tp");
    w("where not exists (select 1 from upd)");
    w(`  and not exists (select 1 from public.learning_contents c where c.topic_id = tp.id and c.metadata ->> 'source' = '${PS}');`);
    w();
  }

  if (d.quiz) {
    const n = d.quiz.length;
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
    w(`  ${q(`${n} questions to check what you learned about ${l.title}.`)},`);
    w(`  ${n}, ${Math.ceil(n * 0.4)}, true, '${l.difficulty}',`);
    w("  g.id, tp.id, 'published', false,");
    w(`  0, ${q(`Answer all ${n} questions. Each carries 1 mark. No negative marking. You have ${n} minutes to complete this test.`)},`);
    w("  g.show_on_website, g.show_on_mobile");
    w("from g, tp");
    w("on conflict (id) do update set");
    w("  title = excluded.title, question_count = excluded.question_count,");
    w("  duration_minutes = excluded.duration_minutes, description = excluded.description,");
    w("  total_marks = excluded.total_marks, pass_marks = excluded.pass_marks,");
    w("  difficulty = excluded.difficulty, instructions = excluded.instructions,");
    w("  updated_at = now()");
    w("where (practice_tests.title, practice_tests.question_count, practice_tests.duration_minutes, practice_tests.description,");
    w("       practice_tests.total_marks, practice_tests.pass_marks, practice_tests.difficulty, practice_tests.instructions)");
    w("  is distinct from (excluded.title, excluded.question_count, excluded.duration_minutes, excluded.description,");
    w("       excluded.total_marks, excluded.pass_marks, excluded.difficulty, excluded.instructions);");
    w();
    w("insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)");
    w("values");
    d.quiz.forEach((qq, i) => {
      w(`  ('${qid(l, i)}', '${testId(l)}',`);
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
    w(`  and id <> all (array[${d.quiz.map((_, i) => `'${qid(l, i)}'`).join(", ")}]);`);
    w();
  }
}

// ---- validation --------------------------------------------------------------
w("-- ===========================================================================");
w("-- VALIDATION — fail loudly if this batch did not land exactly.");
w("-- ===========================================================================");
w("do $val$");
w("declare");
w("  v_bodies int; v_descr int; v_practice int; v_tests int; v_questions int;");
w("begin");
w("  select count(*) into v_bodies");
w("    from public.learning_contents c join public.learning_topics t on t.id = c.topic_id");
w("    join (values");
data.forEach((d, i) => w(`      ('${ref(d.l)}', '${md5(d.body)}', '${md5(d.description)}')${i === data.length - 1 ? "" : ","}`));
w("    ) v(ref, body_md5, descr_md5) on v.ref = t.source_ref");
w(`   where t.source_kind = '${TK}' and c.metadata ->> 'source' = '${CS}' and md5(c.body) = v.body_md5 and md5(t.short_description) = v.descr_md5;`);
w(`  if v_bodies <> ${lessons.length} then raise exception 'validation: expected ${lessons.length} rewritten lessons, found %', v_bodies; end if;`);
w("  select count(*) into v_practice");
w("    from public.learning_contents c join public.learning_topics t on t.id = c.topic_id");
w(`   where t.source_kind = '${TK}' and t.source_ref in (${withPractice.length ? refsOf(withPractice) : "null"})`);
w(`     and c.metadata ->> 'source' = '${PS}' and c.metadata ->> 'origin' = '${ORIGIN}';`);
w(`  if v_practice <> ${withPractice.length} then raise exception 'validation: expected ${withPractice.length} practice blocks, found %', v_practice; end if;`);
w(`  select count(*) into v_tests from public.practice_tests where id in (${testList || "null"}) and learning_topic_id is not null;`);
w(`  if v_tests <> ${withQuiz.length} then raise exception 'validation: expected ${withQuiz.length} linked mock tests, found %', v_tests; end if;`);
w(`  select count(*) into v_questions from public.test_questions where test_id in (${testList || "null"});`);
w(`  if v_questions <> ${questionTotal} then raise exception 'validation: expected ${questionTotal} MCQs, found %', v_questions; end if;`);
w(`  raise notice '${nums.mobile}/${nums.admin} OK: ${course.name} rewrite batch ${NN}: % lessons, % practice blocks, % tests, % MCQs.',`);
w("    v_bodies, v_practice, v_tests, v_questions;");
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
r("-- Generated by scripts/build-java-seed.mjs. NOT a migration: this folder is outside");
r("-- supabase/migrations, so the CLI never applies it. Run it by hand, once, in one transaction.");
r("--");
r(`-- Puts the ${lessons.length} lesson bodies and short_descriptions back to the original`);
r(`-- ${path.basename(course.seedMigration)} text, but only where they still hold this batch's text (a later admin edit`);
r(`-- is left alone and reported). Removes the ${withPractice.length} Practice Problems blocks this batch added and the`);
r(`-- ${withQuiz.length} mock tests with their MCQs. Deleting a mock test also deletes students' attempts on it;`);
r("-- the count is printed first. Topics, bookmarks and progress are never touched.");
r("-- Safe to run twice: the second run finds nothing and changes nothing.");
r("-- ----------------------------------------------------------------------------");
r("do $rollback$");
r("declare");
r("  v_attempts int; v_n int;");
r("begin");
r(`  select count(*) into v_attempts from public.test_attempts where test_id in (${testList || "null"});`);
r(`  raise notice 'rollback: removing ${withQuiz.length} mock test(s) if present; this deletes % test attempt(s).', v_attempts;`);
r(`  delete from public.practice_tests where id in (${testList || "null"});   -- cascades test_questions, test_attempts`);
r("  delete from public.learning_contents c using public.learning_topics t");
r(`   where t.id = c.topic_id and t.source_kind = '${TK}' and t.source_ref in (${withPractice.length ? refsOf(withPractice) : "null"})`);
r(`     and c.metadata ->> 'source' = '${PS}' and c.metadata ->> 'origin' = '${ORIGIN}';`);
r("  get diagnostics v_n = row_count;");
r("  raise notice 'rollback: removed % practice block(s).', v_n;");
r("end");
r("$rollback$;");
r();
for (const d of data) {
  const { l } = d;
  r(`-- ${l.title}: restore the original text where this batch's text is still in place`);
  r(`with src(old_body, old_descr, new_md5, new_descr_md5) as (values (${q(d.old.body)},`);
  r(`  ${q(d.old.description)}, '${md5(d.body)}', '${md5(d.description)}')),`);
  r(`tp as (${TOPIC(l)}),`);
  r("upd as (");
  r("  update public.learning_contents c set body = src.old_body, updated_at = now()");
  r("  from src, tp");
  r(`  where c.topic_id = tp.id and c.metadata ->> 'source' = '${CS}' and md5(c.body) = src.new_md5`);
  r("  returning c.topic_id");
  r(")");
  r("update public.learning_topics t set");
  r("  short_description = case when md5(t.short_description) = src.new_descr_md5 then src.old_descr else t.short_description end,");
  r("  updated_at = now()");
  r("from src, tp");
  r("where t.id = tp.id and (md5(t.short_description) = src.new_descr_md5 or exists (select 1 from upd));");
  r();
}
r("do $report$");
r("declare v_kept text;");
r("begin");
r("  select string_agg(t.slug, ', ' order by t.slug) into v_kept");
r("    from public.learning_contents c join public.learning_topics t on t.id = c.topic_id");
r("    join (values");
data.forEach((d, i) => r(`      ('${ref(d.l)}', '${md5(d.old.body)}')${i === data.length - 1 ? "" : ","}`));
r("    ) v(ref, old_md5) on v.ref = t.source_ref");
r(`   where t.source_kind = '${TK}' and c.metadata ->> 'source' = '${CS}' and md5(c.body) <> v.old_md5;`);
r("  if v_kept is null then raise notice 'rollback: all lesson bodies are back to the original seed text.';");
r("  else raise notice 'rollback: these bodies were edited after the rewrite and were left as they are: %', v_kept; end if;");
r("end");
r("$report$;");
r();
r("notify pgrst, 'reload schema';");
fs.mkdirSync(path.dirname(rollbackFile), { recursive: true });
fs.writeFileSync(rollbackFile, rb.join("\n") + "\n");

// ---- read-only pre-check ------------------------------------------------------------
const ck = [];
const c = (s = "") => ck.push(s);
c(`-- mobile-app/supabase/checks/${path.basename(checkFile)}`);
c(`-- READ-ONLY. Run before ${mobileName} (or its admin twin ${adminName}) to see what it will do.`);
c("-- One row per topic. body_state: 'original' = will be rewritten, 'rewritten' = already done,");
c("-- 'EDITED' = an admin changed it, and the migration will refuse to run until that is resolved.");
c("-- has_practice_block / has_test show rows that already exist; ok must be true on every row.");
c("select v.slug,");
c("  case md5(cb.body) when v.old_md5 then 'original' when v.new_md5 then 'rewritten' else 'EDITED' end as body_state,");
c("  t.status, t.show_on_website, t.show_on_mobile,");
c(`  exists (select 1 from public.learning_contents p where p.topic_id = t.id and p.metadata ->> 'source' = '${PS}') as has_practice_block,`);
c("  exists (select 1 from public.practice_tests p where p.id = 'pt-java-' || v.slug) as has_test,");
c("  (select count(*) from public.test_attempts a where a.test_id = 'pt-java-' || v.slug) as test_attempts,");
c("  t.id is not null and md5(cb.body) in (v.old_md5, v.new_md5)");
c("    and (not v.adds_practice or not exists (select 1 from public.learning_contents p where p.topic_id = t.id");
c(`         and p.metadata ->> 'source' = '${PS}' and p.metadata ->> 'origin' is distinct from '${ORIGIN}')) as ok`);
c("from (values");
data.forEach((d, i) => c(`  ('${d.l.slug}', '${ref(d.l)}', '${md5(d.old.body)}', '${md5(d.body)}', ${d.practice ? "true" : "false"})${i === data.length - 1 ? "" : ","}`));
c(") v(slug, ref, old_md5, new_md5, adds_practice)");
c(`left join public.learning_topics t on t.source_kind = '${TK}' and t.source_ref = v.ref`);
c(`left join public.learning_contents cb on cb.topic_id = t.id and cb.metadata ->> 'source' = '${CS}'`);
c("order by v.slug;");
fs.mkdirSync(path.dirname(checkFile), { recursive: true });
fs.writeFileSync(checkFile, ck.join("\n") + "\n");

// ---- chain order ----------------------------------------------------------------
const chain = path.join(ROOT, "mobile-app", "supabase", "tests", "harness", "chain_order.txt");
const chainText = fs.readFileSync(chain, "utf8");
const lines = [`mobile ${mobileName}`, `admin ${adminName}`].filter((x) => !chainText.split("\n").includes(x));
if (lines.length) fs.appendFileSync(chain, (chainText.endsWith("\n") ? "" : "\n") + lines.join("\n") + "\n");

const kb = (f) => `${(fs.statSync(f).size / 1024).toFixed(1)} KB`;
console.log(`\nbatch ${NN}: ${lessons.length} lesson(s), ${withPractice.length} practice block(s), ${withQuiz.length} test(s), ${questionTotal} MCQs`);
console.log(`  ${mobileRel} (${kb(mobileFile)})`);
console.log(`  ${adminRel} (${kb(adminFile)})`);
console.log(`  mobile-app/supabase/rollbacks/${path.basename(rollbackFile)} (${kb(rollbackFile)})`);
console.log(`  mobile-app/supabase/checks/${path.basename(checkFile)} (${kb(checkFile)})`);
console.log(lines.length ? `  chain_order.txt: appended ${lines.length} line(s)` : "  chain_order.txt: already listed");
