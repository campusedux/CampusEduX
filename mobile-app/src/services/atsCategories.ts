// Turns the deterministic compute_ats_breakdown() RPC result + the résumé's
// own content into the 7-category ATS breakdown the UI shows. NO new scoring
// backend: `keywords / skills / formatting / readability` pass through from
// the RPC unchanged; `contact / experience / education` are framed here from
// data that's already loaded, using fixed rules (never random). The RPC's
// rule `tips` are routed into the matching category's weak/suggestion lists.
//
// Mirror of website/src/lib/resumeBuilder/atsCategories.ts — keep the logic
// identical so website and app show the same score for the same résumé.

import { sectionTarget, type CompletionTarget } from "@/services/resumeContent";
import type { ATSBreakdown, ATSTip, ResumeContent, ResumePersonalDetails, ResumeSectionType as SectionType } from "@/types";

export type AtsCategoryKey = "contact" | "keywords" | "skills" | "experience" | "education" | "formatting" | "readability";
export type AtsStatus = "strong" | "ok" | "weak";

export interface AtsCategory {
  key: AtsCategoryKey;
  label: string;
  score: number;
  status: AtsStatus;
  good: string[];
  weak: string[];
  suggestions: string[];
  /** where the "Improve …" button should jump in the editor, when there is a relevant section. */
  target?: CompletionTarget;
}

export interface AtsAnalysis {
  overall: number;
  categories: AtsCategory[];
}

export const ATS_CATEGORY_LABELS: Record<AtsCategoryKey, string> = {
  contact: "Contact Information",
  keywords: "Keywords",
  skills: "Skills",
  experience: "Experience",
  education: "Education",
  formatting: "Formatting",
  readability: "Readability",
};

const ACTION_VERBS = [
  "built", "led", "designed", "implemented", "improved", "developed", "created", "launched", "shipped", "owned",
  "reduced", "increased", "cut", "raised", "drove", "delivered", "managed", "mentored", "automated", "migrated",
  "architected", "optimised", "optimized", "scaled", "streamlined", "coordinated", "analysed", "analyzed", "researched",
];

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
function statusOf(score: number): AtsStatus {
  return score >= 80 ? "strong" : score >= 55 ? "ok" : "weak";
}

// ---------------------------------------------------------------------------
// One pass over `content` for the derived categories.
// ---------------------------------------------------------------------------
interface ContentStats {
  expTypes: SectionType[];
  hasExperience: boolean;
  experienceEntries: number;
  bulletLines: number;
  actionVerbStarts: number;
  quantifiedBullets: number;
  educationEntries: number;
  eduWithInstitution: number;
  eduWithDates: number;
  eduWithGrade: number;
  skillItems: number;
  skillGroups: number;
  longParagraphs: number;
  summaryWords: number;
}

const EXPERIENCE_TYPES: SectionType[] = ["experience", "internships", "projects"];

function analyseContent(content: ResumeContent): ContentStats {
  const visible = content.filter((b) => !b.hidden);
  const s: ContentStats = {
    expTypes: EXPERIENCE_TYPES,
    hasExperience: false,
    experienceEntries: 0,
    bulletLines: 0,
    actionVerbStarts: 0,
    quantifiedBullets: 0,
    educationEntries: 0,
    eduWithInstitution: 0,
    eduWithDates: 0,
    eduWithGrade: 0,
    skillItems: 0,
    skillGroups: 0,
    longParagraphs: 0,
    summaryWords: 0,
  };

  for (const b of visible) {
    if (b.type === "summary" || b.type === "objective") {
      s.summaryWords += (b.text ?? "").trim().split(/\s+/).filter(Boolean).length;
    }
    if (EXPERIENCE_TYPES.includes(b.type)) {
      for (const e of b.entries ?? []) {
        const filled = e.title.trim() || e.description.trim();
        if (!filled) continue;
        s.hasExperience = true;
        s.experienceEntries += 1;
        for (const raw of e.description.split("\n")) {
          const line = raw.replace(/^[\s•\-–*]+/, "").trim();
          if (!line) continue;
          s.bulletLines += 1;
          const first = line.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
          if (ACTION_VERBS.includes(first)) s.actionVerbStarts += 1;
          if (/\d/.test(line)) s.quantifiedBullets += 1;
          if (line.length > 180) s.longParagraphs += 1;
        }
      }
    }
    if (b.type === "education") {
      for (const e of b.entries ?? []) {
        if (!e.title.trim()) continue;
        s.educationEntries += 1;
        if (e.subtitle.trim()) s.eduWithInstitution += 1;
        if (e.startDate.trim() || e.endDate.trim()) s.eduWithDates += 1;
        if (/\d/.test(e.description)) s.eduWithGrade += 1;
      }
    }
    if (b.type === "skills") {
      for (const g of b.groups ?? []) {
        if (g.items.length > 0) s.skillGroups += 1;
        s.skillItems += g.items.length;
      }
    }
    if (b.variant === "text") {
      for (const raw of (b.text ?? "").split("\n")) {
        if (raw.trim().length > 220) s.longParagraphs += 1;
      }
    }
  }
  return s;
}

// ---------------------------------------------------------------------------
// Route the RPC's rule tips into categories.
// ---------------------------------------------------------------------------
const SECTION_TO_CATEGORY: Record<string, AtsCategoryKey> = {
  work_experience: "experience",
  education: "education",
  skills: "skills",
  formatting: "formatting",
  profile_summary: "readability",
  general: "keywords",
};

function tipsFor(category: AtsCategoryKey, tips: ATSTip[]) {
  return tips.filter((t) => t.ruleId !== null && SECTION_TO_CATEGORY[t.section] === category);
}

// ---------------------------------------------------------------------------
// Per-category builders.
// ---------------------------------------------------------------------------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function contactCategory(personal: ResumePersonalDetails): AtsCategory {
  const checks = [
    { ok: Boolean(personal.fullName?.trim()), label: "Full name", missing: "Add your full name" },
    { ok: EMAIL_RE.test(personal.email?.trim() ?? ""), label: "Valid email address", missing: "Add a valid email address" },
    { ok: Boolean(personal.phone?.trim()), label: "Phone number", missing: "Add a phone number" },
    { ok: Boolean(personal.location?.trim()), label: "Location", missing: "Add your city / location" },
    {
      ok: Boolean(personal.linkedin?.trim() || personal.github?.trim() || personal.website?.trim()),
      label: "A professional link (LinkedIn / GitHub / portfolio)",
      missing: "Add a LinkedIn, GitHub or portfolio link",
    },
  ];
  const score = clamp((checks.filter((c) => c.ok).length / checks.length) * 100);
  const good = checks.filter((c) => c.ok).map((c) => `${c.label} present`);
  const weak = checks.filter((c) => !c.ok).map((c) => c.missing);
  return {
    key: "contact",
    label: ATS_CATEGORY_LABELS.contact,
    score,
    status: statusOf(score),
    good: good.length ? good : ["All key contact details are filled in"],
    weak,
    suggestions: weak.length ? ["Recruiters and ATS both scan the header first — fill every field."] : [],
    target: { kind: "personal" },
  };
}

function keywordsCategory(breakdown: ATSBreakdown, content: ResumeContent): AtsCategory {
  const score = clamp(breakdown.keywords);
  const tips = tipsFor("keywords", breakdown.tips);
  const good: string[] = [];
  const weak: string[] = [];
  if (score >= 60) good.push("Uses recognised résumé action / impact keywords");
  else weak.push("Few strong keywords found in your summary, experience and projects");
  weak.push(...tips.map((t) => t.problem));
  return {
    key: "keywords",
    label: ATS_CATEGORY_LABELS.keywords,
    score,
    status: statusOf(score),
    good: good.length ? good : ["Some relevant keywords detected"],
    weak,
    suggestions: [
      "Paste the target job description into Job Match to see the exact terms to mirror.",
      "Start bullets with strong verbs (Built, Led, Reduced) and name the tools you used.",
      ...tips.map((t) => t.why).filter(Boolean),
    ],
    target: sectionTarget(content, ["experience", "internships", "projects"]),
  };
}

function skillsCategory(breakdown: ATSBreakdown, content: ResumeContent, stats: ContentStats): AtsCategory {
  const score = clamp(breakdown.skills);
  const tips = tipsFor("skills", breakdown.tips);
  const good: string[] = [];
  const weak: string[] = [];
  if (stats.skillItems >= 8) good.push(`${stats.skillItems} skills listed`);
  else weak.push(`Only ${stats.skillItems} skill${stats.skillItems === 1 ? "" : "s"} listed — aim for 8–15`);
  if (stats.skillGroups >= 2) good.push("Skills grouped into categories");
  else weak.push("Skills are not grouped (e.g. Languages / Frameworks / Tools)");
  weak.push(...tips.map((t) => t.problem));
  return {
    key: "skills",
    label: ATS_CATEGORY_LABELS.skills,
    score,
    status: statusOf(score),
    good: good.length ? good : ["A skills section is present"],
    weak,
    suggestions: [
      "List 8–15 concrete, role-relevant skills.",
      "Group them (Languages, Frameworks, Tools, Databases) so a parser reads them cleanly.",
      ...tips.map((t) => t.why).filter(Boolean),
    ],
    target: sectionTarget(content, ["skills"]),
  };
}

function experienceCategory(breakdown: ATSBreakdown, content: ResumeContent, stats: ContentStats): AtsCategory {
  const verbRatio = stats.bulletLines ? stats.actionVerbStarts / stats.bulletLines : 0;
  const quantRatio = stats.bulletLines ? stats.quantifiedBullets / stats.bulletLines : 0;
  const score = clamp(
    (stats.hasExperience ? 40 : 0) +
      Math.min(20, stats.bulletLines * 4) +
      verbRatio * 20 +
      quantRatio * 20,
  );
  const tips = tipsFor("experience", breakdown.tips);
  const good: string[] = [];
  const weak: string[] = [];
  if (stats.hasExperience) good.push(`Experience section with ${stats.experienceEntries} entr${stats.experienceEntries === 1 ? "y" : "ies"}`);
  else weak.push("No experience, internship or project entries yet");
  if (verbRatio >= 0.5) good.push("Most bullets start with a strong action verb");
  else if (stats.bulletLines) weak.push("Add measurable achievements and stronger opening verbs to your bullets");
  if (quantRatio >= 0.3) good.push("Bullets include measurable results (numbers, %, ₹)");
  else if (stats.bulletLines) weak.push("Quantify impact — add %, ₹, time saved, users, scale");
  if (stats.bulletLines < 3 && stats.hasExperience) weak.push("Add more detail — aim for 3–5 bullet points per role");
  weak.push(...tips.map((t) => t.problem));
  return {
    key: "experience",
    label: ATS_CATEGORY_LABELS.experience,
    score,
    status: statusOf(score),
    good: good.length ? good : ["Experience content detected"],
    weak,
    suggestions: [
      "Write each bullet as: strong verb → what you did → measurable result.",
      "Mirror keywords from the job description where they're genuinely true.",
      ...tips.map((t) => t.why).filter(Boolean),
    ],
    target: sectionTarget(content, ["experience", "internships", "projects"]),
  };
}

function educationCategory(content: ResumeContent, stats: ContentStats): AtsCategory {
  const has = stats.educationEntries > 0;
  const score = clamp(
    (has ? 60 : 0) +
      (has && stats.eduWithInstitution >= stats.educationEntries ? 15 : 0) +
      (has && stats.eduWithDates >= stats.educationEntries ? 15 : 0) +
      (has && stats.eduWithGrade > 0 ? 10 : 0),
  );
  const good: string[] = [];
  const weak: string[] = [];
  if (has) good.push(`${stats.educationEntries} education entr${stats.educationEntries === 1 ? "y" : "ies"} listed`);
  else weak.push("No education entry — add your degree / qualification");
  if (has && stats.eduWithInstitution < stats.educationEntries) weak.push("Add the institution name to every entry");
  else if (has) good.push("Institution names present");
  if (has && stats.eduWithDates < stats.educationEntries) weak.push("Add start / end years to every entry");
  else if (has) good.push("Dates present");
  if (has && stats.eduWithGrade === 0) weak.push("Add your CGPA / percentage if it's strong");
  return {
    key: "education",
    label: ATS_CATEGORY_LABELS.education,
    score,
    status: statusOf(score),
    good: good.length ? good : ["Education section detected"],
    weak,
    suggestions: has
      ? ["List your most recent qualification first, with institution, years and score."]
      : ["Add an Education section with your degree, institution and graduation year."],
    target: sectionTarget(content, ["education"]),
  };
}

function formattingCategory(breakdown: ATSBreakdown, personal: ResumePersonalDetails): AtsCategory {
  let score = clamp(breakdown.formatting);
  const tips = tipsFor("formatting", breakdown.tips);
  const good = ["Single-column, parseable layout", "Standard, recognisable section headings"];
  const weak = tips.map((t) => t.problem);
  const suggestions = tips.map((t) => t.why).filter(Boolean);
  if (personal.photoUrl?.trim()) {
    weak.push("A profile photo is set — many ATS parsers drop images");
    suggestions.push("For a strictly ATS-safe résumé, leave the photo URL blank.");
    score = clamp(score - 8);
  }
  return {
    key: "formatting",
    label: ATS_CATEGORY_LABELS.formatting,
    score,
    status: statusOf(score),
    good,
    weak: weak.length ? weak : ["No formatting problems detected"],
    suggestions,
    target: personal.photoUrl?.trim() ? { kind: "personal" } : undefined,
  };
}

function readabilityCategory(breakdown: ATSBreakdown, content: ResumeContent, stats: ContentStats): AtsCategory {
  const score = clamp(breakdown.readability);
  const tips = tipsFor("readability", breakdown.tips);
  const good: string[] = [];
  const weak: string[] = [];
  if (stats.longParagraphs === 0) good.push("Concise lines — no walls of text");
  else weak.push(`${stats.longParagraphs} very long line${stats.longParagraphs === 1 ? "" : "s"} — break into shorter bullets`);
  if (stats.bulletLines >= 3) good.push("Good use of bullet points");
  if (stats.summaryWords > 90) weak.push("Your summary is long — trim it to 2–3 sentences");
  else if (stats.summaryWords > 0) good.push("Summary is a tight length");
  weak.push(...tips.map((t) => t.problem));
  return {
    key: "readability",
    label: ATS_CATEGORY_LABELS.readability,
    score,
    status: statusOf(score),
    good: good.length ? good : ["Overall structure reads well"],
    weak,
    suggestions: [
      "One idea per bullet; keep lines under ~2 lines of text.",
      "Lead the résumé with a 2–3 sentence summary.",
      ...tips.map((t) => t.why).filter(Boolean),
    ],
    target: stats.summaryWords > 90 ? sectionTarget(content, ["summary", "objective"]) : undefined,
  };
}

/**
 * The 7-category ATS breakdown. `overall` is the RPC's deterministic score,
 * unchanged; each category score is deterministic (RPC pass-through or a
 * fixed rule over the résumé's own data).
 */
export function buildAtsAnalysis(breakdown: ATSBreakdown, content: ResumeContent, personal: ResumePersonalDetails): AtsAnalysis {
  const stats = analyseContent(content);
  return {
    overall: clamp(breakdown.overall),
    categories: [
      contactCategory(personal),
      keywordsCategory(breakdown, content),
      skillsCategory(breakdown, content, stats),
      experienceCategory(breakdown, content, stats),
      educationCategory(content, stats),
      formattingCategory(breakdown, personal),
      readabilityCategory(breakdown, content, stats),
    ],
  };
}
