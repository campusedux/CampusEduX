/**
 * End-to-end verification of the résumé-builder data flow against a real
 * Postgres with migrations 0057..0063 applied. Exercises the ACTUAL pure
 * modules (normalizeContent / contentToLegacyColumns / resolveDesign /
 * buildResumeRenderModel / completionItems) together with the ACTUAL SQL
 * functions (compute_ats_breakdown / match_resume_to_jd / get_shared_resume),
 * as a real `authenticated` role — the layer unit tests + build gates can't
 * reach.
 *
 * Opt-in: skipped unless SCRATCH_PG_SOCK points at a running cluster whose
 * `resume_scratch` DB has the schema + an auth.uid() stub + owner RLS.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { normalizeContent, contentToLegacyColumns, defaultStarterContent, completionItems, computeCompletion } from "@/lib/resumeBuilder/content";
import { demoResume } from "@/lib/resumeBuilder/demoResumes";
import { resolveDesign, sanitizeDesign } from "@/lib/resumeBuilder/design";
import { templateSpec } from "@/lib/resumeBuilder/templateSpecs";
import { buildResumeRenderModel } from "@/lib/resumeBuilder/renderModel";
import { renderResumePdfBuffer } from "@/lib/resumeBuilder/pdfDocument";
import { buildAtsAnalysis } from "@/lib/resumeBuilder/atsCategories";
import { mapResumeRow, type ATSBreakdown } from "@/lib/resumeBuilder/types";

const SOCK = process.env.SCRATCH_PG_SOCK;
const PORT = process.env.SCRATCH_PG_PORT ?? "5464";
const DB = "resume_scratch";
const run = SOCK ? describe : describe.skip;

/** Runs as the `authenticated` role (RLS enforced) with app.uid set, or as `anon` when uid is omitted. */
function sql(query: string, uid?: string): string {
  const prefixed = uid ? `set role authenticated; set app.uid = '${uid}'; ${query}` : `set role anon; ${query}`;
  return execFileSync("psql", ["-h", SOCK!, "-p", PORT, "-U", "postgres", "-d", DB, "-v", "ON_ERROR_STOP=1", "-tAqc", prefixed], {
    encoding: "utf8",
  }).trim();
}
/** Runs as the table owner (superuser, RLS bypassed) — for fixture setup only. */
function sqlOwner(query: string): string {
  return execFileSync("psql", ["-h", SOCK!, "-p", PORT, "-U", "postgres", "-d", DB, "-v", "ON_ERROR_STOP=1", "-tAqc", query], { encoding: "utf8" }).trim();
}
const j = (o: unknown) => JSON.stringify(o).replace(/'/g, "''");

run("résumé flow E2E (scratch Postgres, real authenticated role)", () => {
  const userA = randomUUID();
  const userB = randomUUID();
  let resumeId = "";

  beforeAll(() => {
    try {
      sqlOwner(`insert into public.profiles (id) values ('${userA}'),('${userB}') on conflict do nothing;`);
    } catch {
      /* minimal scratch schema has no profiles table — fine */
    }
  });

  it("§4-5 create from template: seeds the demo persona + is_demo, mirrors legacy columns", () => {
    const demo = demoResume("professional");
    const content = normalizeContent(demo.content);
    const legacy = contentToLegacyColumns(content);
    resumeId = randomUUID();
    sql(
      `insert into public.resumes_builder (id, user_id, title, template, is_demo, personal_details, content, education, skills, sections, layout)
       values ('${resumeId}', '${userA}', '${j(demo.persona)} résumé (demo)', 'professional', true,
       '${j(demo.personalDetails)}'::jsonb, '${j(content)}'::jsonb, '${j(legacy.education)}'::jsonb,
       '${j(legacy.skills)}'::jsonb, '${j(legacy.sections)}'::jsonb, '${j(legacy.layout)}'::jsonb);`,
      userA,
    );
    const row = sql(
      `select jsonb_build_object('is_demo', is_demo, 'blocks', jsonb_array_length(content),
        'legacy_summary', sections->>'summary', 'edu', jsonb_array_length(education)) from public.resumes_builder where id='${resumeId}';`,
      userA,
    );
    const parsed = JSON.parse(row);
    expect(parsed.is_demo).toBe(true);
    expect(parsed.blocks).toBeGreaterThanOrEqual(8);
    expect(parsed.legacy_summary).toMatch(/FinTech/);
    expect(parsed.edu).toBe(1);
  });

  it("§7-8 edit + add sections: updateContent normalizes and re-mirrors legacy", () => {
    const doc = mapResumeRow(JSON.parse(sql(`select row_to_json(r) from public.resumes_builder r where id='${resumeId}'`, userA)));
    let content = [...doc.content];
    // edit the summary block
    content = content.map((b) => (b.type === "summary" ? { ...b, text: "Edited summary — shipped payments at scale." } : b));
    // add a fresh experience entry to the experience block
    content = content.map((b) =>
      b.type === "experience"
        ? { ...b, entries: [...(b.entries ?? []), { id: "new-1", title: "Staff Engineer", subtitle: "NimbusPay", location: "Remote", startDate: "2026", endDate: "Present", description: "Owning the ledger rewrite", url: "", tags: ["Rust"] }] }
        : b,
    );
    const normalized = normalizeContent(content);
    const legacy = contentToLegacyColumns(normalized);
    sql(
      `update public.resumes_builder set content='${j(normalized)}'::jsonb, sections='${j(legacy.sections)}'::jsonb,
       education='${j(legacy.education)}'::jsonb, skills='${j(legacy.skills)}'::jsonb, layout='${j(legacy.layout)}'::jsonb,
       updated_at=now() where id='${resumeId}';`,
      userA,
    );
    const check = JSON.parse(
      sql(`select jsonb_build_object('summary', sections->>'summary', 'exp', sections->>'experience') from public.resumes_builder where id='${resumeId}'`, userA),
    );
    expect(check.summary).toBe("Edited summary — shipped payments at scale.");
    expect(check.exp).toMatch(/Staff Engineer/);
    expect(check.exp).toMatch(/ledger rewrite/);
  });

  it("§12 reorder: moveBlock persists to content + layout.order", () => {
    const doc = mapResumeRow(JSON.parse(sql(`select row_to_json(r) from public.resumes_builder r where id='${resumeId}'`, userA)));
    const reordered = [doc.content[2], doc.content[0], doc.content[1], ...doc.content.slice(3)];
    const legacy = contentToLegacyColumns(reordered);
    sql(`update public.resumes_builder set content='${j(reordered)}'::jsonb, layout='${j(legacy.layout)}'::jsonb where id='${resumeId}';`, userA);
    const back = mapResumeRow(JSON.parse(sql(`select row_to_json(r) from public.resumes_builder r where id='${resumeId}'`, userA)));
    expect(back.content[0].type).toBe(doc.content[2].type);
  });

  it("§11 change template keeps content byte-for-byte", () => {
    const before = sql(`select md5(content::text) from public.resumes_builder where id='${resumeId}'`, userA);
    sql(`update public.resumes_builder set template='creative' where id='${resumeId}';`, userA);
    const after = sql(`select md5(content::text) from public.resumes_builder where id='${resumeId}'`, userA);
    expect(after).toBe(before);
    expect(sql(`select template from public.resumes_builder where id='${resumeId}'`, userA)).toBe("creative");
  });

  it("§12 design overrides persist and resolveDesign clamps them ATS-safe", () => {
    const design = sanitizeDesign({ accentColor: "#0F766E", fontFamily: "serif", size: "s", spacing: "compact", margin: "narrow", headingStyle: "full-underline" });
    sql(`update public.resumes_builder set design='${j(design)}'::jsonb where id='${resumeId}';`, userA);
    const stored = sanitizeDesign(JSON.parse(sql(`select design from public.resumes_builder where id='${resumeId}'`, userA)));
    expect(stored.fontFamily).toBe("serif");
    // single-column templates clamp the page margin; the band header keeps padding 0 by design
    const single = resolveDesign(templateSpec("minimal"), stored);
    expect(single.type.body).toBeGreaterThanOrEqual(9.5);
    expect(single.type.padding).toBeGreaterThanOrEqual(28);
    expect(single.type.sectionGap).toBeGreaterThanOrEqual(10);
    expect(resolveDesign(templateSpec("creative"), stored).heading).toBe("full-underline");
  });

  it("§13 compute_ats_breakdown writes ats_score, and buildAtsAnalysis frames it as the 7 named categories", () => {
    const out: ATSBreakdown = JSON.parse(sql(`select public.compute_ats_breakdown('${resumeId}')`, userA));
    for (const k of ["overall", "content", "formatting", "skills", "keywords", "completeness", "readability"] as const) {
      expect(typeof out[k]).toBe("number");
      expect(out[k]).toBeGreaterThanOrEqual(0);
      expect(out[k]).toBeLessThanOrEqual(100);
    }
    expect(Array.isArray(out.tips)).toBe(true);
    expect(sql(`select ats_score from public.resumes_builder where id='${resumeId}'`, userA)).toBe(String(out.overall));

    const doc = mapResumeRow(JSON.parse(sql(`select row_to_json(r) from public.resumes_builder r where id='${resumeId}'`, userA)));
    const analysis = buildAtsAnalysis(out, doc.content, doc.personalDetails);
    expect(analysis.overall).toBe(out.overall); // overall unchanged — deterministic
    expect(analysis.categories.map((c) => c.key)).toEqual(["contact", "keywords", "skills", "experience", "education", "formatting", "readability"]);
    for (const c of analysis.categories) {
      expect(c.score).toBeGreaterThanOrEqual(0);
      expect(c.score).toBeLessThanOrEqual(100);
      expect(c.good.length + c.weak.length).toBeGreaterThan(0);
    }
    // re-running on the same data gives the same scores
    const again = buildAtsAnalysis(out, doc.content, doc.personalDetails);
    expect(again.categories.map((c) => c.score)).toEqual(analysis.categories.map((c) => c.score));
  });

  it("§14 match_resume_to_jd returns a percent + matched/missing", () => {
    const out = JSON.parse(
      sql(`select public.match_resume_to_jd('${resumeId}', 'Senior backend engineer, Java, Kafka, Kubernetes, payments, compliance, mentoring')`, userA),
    );
    expect(out.matchPercent).toBeGreaterThan(0);
    expect(Array.isArray(out.matched)).toBe(true);
    expect(out.matched).toContain("java");
    expect(Array.isArray(out.missing)).toBe(true);
  });

  it("§17-18 reload → mapResumeRow → render model → real PDF (with the custom design)", async () => {
    const doc = mapResumeRow(JSON.parse(sql(`select row_to_json(r) from public.resumes_builder r where id='${resumeId}'`, userA)));
    expect(doc.isDemo).toBe(true);
    expect(doc.design.fontFamily).toBe("serif");
    const model = buildResumeRenderModel({ personalDetails: doc.personalDetails, content: doc.content });
    expect(model.blocks.length).toBeGreaterThanOrEqual(6);
    const pdf = await renderResumePdfBuffer(doc, "#1E3A8A");
    expect(pdf.subarray(0, 5).toString("utf8")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(2000);
  });

  it("§15 completion is derived deterministically from the reloaded doc", () => {
    const doc = mapResumeRow(JSON.parse(sql(`select row_to_json(r) from public.resumes_builder r where id='${resumeId}'`, userA)));
    const items = completionItems(doc.content, doc.personalDetails);
    expect(items).toHaveLength(9);
    expect(computeCompletion(doc.content, doc.personalDetails)).toBeGreaterThan(60);
  });

  it("share: get_shared_resume returns the design, hides is_demo, null for a bogus token", () => {
    const token = "e2e" + randomUUID().replace(/-/g, "");
    sql(`insert into public.resume_shares (user_id, resume_id, token) values ('${userA}', '${resumeId}', '${token}');`, userA);
    const shared = JSON.parse(sql(`select public.get_shared_resume('${token}')`)); // called as anon
    expect(shared).toHaveProperty("design");
    expect(shared).toHaveProperty("content");
    expect(shared).not.toHaveProperty("is_demo");
    expect(sql(`select public.get_shared_resume('nope-not-real') is null`)).toBe("t");
  });

  it("RLS: a second authenticated user cannot read or update the résumé", () => {
    expect(sql(`select count(*) from public.resumes_builder where id='${resumeId}'`, userB)).toBe("0");
    sql(`update public.resumes_builder set title='HACKED' where id='${resumeId}';`, userB); // 0 rows, no error
    expect(sql(`select title from public.resumes_builder where id='${resumeId}'`, userA)).not.toBe("HACKED");
  });

  it("§10 clear demo content: back to the starter set, flag off, personal wiped", () => {
    const content = defaultStarterContent();
    const legacy = contentToLegacyColumns(content);
    const blankPersonal = { fullName: "", jobTitle: "", email: "", phone: "", location: "", linkedin: "", github: "", website: "", photoUrl: null };
    sql(
      `update public.resumes_builder set content='${j(content)}'::jsonb, is_demo=false, personal_details='${j(blankPersonal)}'::jsonb,
       sections='${j(legacy.sections)}'::jsonb, education='${j(legacy.education)}'::jsonb, skills='${j(legacy.skills)}'::jsonb where id='${resumeId}';`,
      userA,
    );
    const doc = mapResumeRow(JSON.parse(sql(`select row_to_json(r) from public.resumes_builder r where id='${resumeId}'`, userA)));
    expect(doc.isDemo).toBe(false);
    expect(doc.personalDetails.fullName).toBe("");
    expect(doc.content.map((b) => b.type)).toEqual(defaultStarterContent().map((b) => b.type));
    expect(computeCompletion(doc.content, doc.personalDetails)).toBe(0);
  });
});
