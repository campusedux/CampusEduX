// The structured resume section model. `resumes_builder.content` is an
// ordered array of these blocks and is the single source of truth for what a
// resume contains and in what order. The legacy columns (sections / education
// / skills / layout) are kept only so an un-migrated row — or an edit from an
// app build that predates this model — can be upgraded on read by
// normalizeContent(). Mirrors mobile-app/src/services/resume.service.ts.

import type { ResumePersonalDetails } from "./types";

export type SectionType =
  | "summary"
  | "objective"
  | "experience"
  | "internships"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "achievements"
  | "awards"
  | "publications"
  | "research"
  | "volunteer"
  | "leadership"
  | "languages"
  | "interests"
  | "coding_profiles"
  | "social_links"
  | "references"
  | "custom";

export type SectionVariant = "text" | "entries" | "tags" | "links";

export interface ResumeEntry {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  startDate: string;
  endDate: string;
  /** newline-separated bullet lines */
  description: string;
  url: string;
  tags: string[];
}

export interface ResumeTagGroup {
  id: string;
  label: string;
  items: string[];
}

export interface ResumeLink {
  id: string;
  label: string;
  url: string;
}

export interface ResumeSectionBlock {
  id: string;
  type: SectionType;
  heading: string;
  variant: SectionVariant;
  hidden: boolean;
  text?: string;
  entries?: ResumeEntry[];
  groups?: ResumeTagGroup[];
  links?: ResumeLink[];
}

export type ResumeContent = ResumeSectionBlock[];

export interface SectionTypeMeta {
  label: string;
  /** the variant a NEWLY ADDED block of this type gets (an upgraded legacy block keeps its own). */
  variant: SectionVariant;
  /** offered in the editor's "Add section" menu. */
  addable: boolean;
}

export const SECTION_TYPE_META: Record<SectionType, SectionTypeMeta> = {
  summary: { label: "Professional Summary", variant: "text", addable: true },
  objective: { label: "Career Objective", variant: "text", addable: true },
  experience: { label: "Work Experience", variant: "entries", addable: true },
  internships: { label: "Internships", variant: "entries", addable: true },
  education: { label: "Education", variant: "entries", addable: true },
  skills: { label: "Technical Skills", variant: "tags", addable: true },
  projects: { label: "Projects", variant: "entries", addable: true },
  certifications: { label: "Certifications", variant: "entries", addable: true },
  achievements: { label: "Achievements", variant: "text", addable: true },
  awards: { label: "Awards", variant: "entries", addable: true },
  publications: { label: "Publications", variant: "entries", addable: true },
  research: { label: "Research", variant: "entries", addable: true },
  volunteer: { label: "Volunteer Experience", variant: "entries", addable: true },
  leadership: { label: "Leadership", variant: "entries", addable: true },
  languages: { label: "Languages", variant: "tags", addable: true },
  interests: { label: "Interests", variant: "tags", addable: true },
  coding_profiles: { label: "Coding Profiles", variant: "links", addable: true },
  social_links: { label: "Links", variant: "links", addable: true },
  references: { label: "References", variant: "text", addable: true },
  custom: { label: "Custom Section", variant: "text", addable: true },
};

const SECTION_TYPES = Object.keys(SECTION_TYPE_META) as SectionType[];
const VARIANTS: SectionVariant[] = ["text", "entries", "tags", "links"];

// ---------------------------------------------------------------------------
// id helper — stable enough for React keys / entry identity, no crypto dep.
// ---------------------------------------------------------------------------
let idCounter = 0;
export function makeId(prefix = "blk"): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

// ---------------------------------------------------------------------------
// Empty factories
// ---------------------------------------------------------------------------
export function emptyEntry(): ResumeEntry {
  return { id: makeId("ent"), title: "", subtitle: "", location: "", startDate: "", endDate: "", description: "", url: "", tags: [] };
}

export function emptyGroup(label = ""): ResumeTagGroup {
  return { id: makeId("grp"), label, items: [] };
}

export function emptyLink(): ResumeLink {
  return { id: makeId("lnk"), label: "", url: "" };
}

export function makeBlock(type: SectionType, heading?: string): ResumeSectionBlock {
  const meta = SECTION_TYPE_META[type];
  const block: ResumeSectionBlock = {
    id: makeId(),
    type,
    heading: heading ?? meta.label,
    variant: meta.variant,
    hidden: false,
  };
  if (meta.variant === "text") block.text = "";
  else if (meta.variant === "entries") block.entries = [emptyEntry()];
  else if (meta.variant === "tags") block.groups = [emptyGroup(type === "skills" ? "Technical" : "")];
  else if (meta.variant === "links") block.links = [emptyLink()];
  return block;
}

/** The starting set for a brand-new resume (also what normalizeContent falls back to when there's nothing to upgrade). */
export function defaultStarterContent(): ResumeContent {
  return [
    makeBlock("summary"),
    makeBlock("experience"),
    makeBlock("education"),
    makeBlock("skills"),
    makeBlock("projects"),
  ];
}

// ---------------------------------------------------------------------------
// Sanitizers
// ---------------------------------------------------------------------------
function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map(asString).map((s) => s.trim()).filter(Boolean) : [];
}
function asBool(v: unknown): boolean {
  return v === true;
}

function sanitizeEntry(raw: unknown): ResumeEntry {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: asString(r.id) || makeId("ent"),
    title: asString(r.title),
    subtitle: asString(r.subtitle),
    location: asString(r.location),
    startDate: asString(r.startDate),
    endDate: asString(r.endDate),
    description: asString(r.description),
    url: asString(r.url),
    tags: asStringArray(r.tags),
  };
}

function sanitizeGroup(raw: unknown): ResumeTagGroup {
  const r = (raw ?? {}) as Record<string, unknown>;
  return { id: asString(r.id) || makeId("grp"), label: asString(r.label), items: asStringArray(r.items) };
}

function sanitizeLink(raw: unknown): ResumeLink {
  const r = (raw ?? {}) as Record<string, unknown>;
  return { id: asString(r.id) || makeId("lnk"), label: asString(r.label), url: asString(r.url) };
}

function sanitizeBlock(raw: unknown, seenIds: Set<string>): ResumeSectionBlock | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const type = (SECTION_TYPES.includes(r.type as SectionType) ? r.type : "custom") as SectionType;
  const meta = SECTION_TYPE_META[type];
  const variant = (VARIANTS.includes(r.variant as SectionVariant) ? r.variant : meta.variant) as SectionVariant;

  let id = asString(r.id) || makeId();
  while (seenIds.has(id)) id = makeId();
  seenIds.add(id);

  const block: ResumeSectionBlock = {
    id,
    type,
    variant,
    heading: asString(r.heading) || meta.label,
    hidden: asBool(r.hidden),
  };

  if (variant === "text") {
    block.text = asString(r.text);
  } else if (variant === "entries") {
    const entries = Array.isArray(r.entries) ? r.entries.map(sanitizeEntry) : [];
    block.entries = entries;
  } else if (variant === "tags") {
    const groups = Array.isArray(r.groups) ? r.groups.map(sanitizeGroup) : [];
    block.groups = groups.length > 0 ? groups : [emptyGroup(type === "skills" ? "Technical" : "")];
  } else if (variant === "links") {
    block.links = Array.isArray(r.links) ? r.links.map(sanitizeLink) : [];
  }
  return block;
}

// ---------------------------------------------------------------------------
// Legacy upgrade — mirrors 0062_resume_content.sql's backfill exactly.
// ---------------------------------------------------------------------------
const LEGACY_ORDER: SectionType[] = [
  "summary",
  "education",
  "skills",
  "experience",
  "projects",
  "certifications",
  "achievements",
  "languages",
  "references",
];
const LEGACY_TEXT_KEYS: SectionType[] = ["summary", "experience", "projects", "certifications", "achievements", "languages", "references"];

export interface LegacyResumeShape {
  sections?: unknown;
  education?: unknown;
  skills?: unknown;
  layout?: unknown;
}

function legacyToContent(legacy: LegacyResumeShape): ResumeContent {
  const sections = (legacy.sections ?? {}) as Record<string, unknown>;
  const educationArr = Array.isArray(legacy.education) ? legacy.education : [];
  const skills = (legacy.skills ?? {}) as { technical?: unknown; soft?: unknown };
  const layout = (legacy.layout ?? {}) as { order?: unknown; hidden?: unknown };

  const rawOrder = Array.isArray(layout.order) ? (layout.order as unknown[]).map(asString) : [];
  const order = [...rawOrder.filter((k) => (LEGACY_ORDER as string[]).includes(k)), ...LEGACY_ORDER.filter((k) => !rawOrder.includes(k))] as SectionType[];
  const hidden = new Set(Array.isArray(layout.hidden) ? (layout.hidden as unknown[]).map(asString) : []);

  const blocks: ResumeContent = [];
  for (const key of order) {
    if (key === "education") {
      if (educationArr.length === 0) continue;
      const entries: ResumeEntry[] = educationArr.map((e) => {
        const r = (e ?? {}) as Record<string, unknown>;
        return {
          id: asString(r.id) || makeId("ent"),
          title: asString(r.degree),
          subtitle: asString(r.institution),
          location: "",
          startDate: asString(r.startYear),
          endDate: asString(r.endYear),
          description: asString(r.percentage) ? `Score: ${asString(r.percentage)}` : "",
          url: "",
          tags: [],
        };
      });
      blocks.push({ id: makeId(), type: "education", variant: "entries", heading: SECTION_TYPE_META.education.label, hidden: hidden.has("education"), entries });
      continue;
    }
    if (key === "skills") {
      const technical = asStringArray(skills.technical);
      const soft = asStringArray(skills.soft);
      if (technical.length === 0 && soft.length === 0) continue;
      const groups: ResumeTagGroup[] = [];
      if (technical.length > 0) groups.push({ id: makeId("grp"), label: "Technical", items: technical });
      if (soft.length > 0) groups.push({ id: makeId("grp"), label: "Soft", items: soft });
      blocks.push({ id: makeId(), type: "skills", variant: "tags", heading: SECTION_TYPE_META.skills.label, hidden: hidden.has("skills"), groups });
      continue;
    }
    if ((LEGACY_TEXT_KEYS as string[]).includes(key)) {
      const text = asString(sections[key]).trim();
      if (!text) continue;
      blocks.push({ id: makeId(), type: key, variant: "text", heading: SECTION_TYPE_META[key].label, hidden: hidden.has(key), text: asString(sections[key]) });
    }
  }
  return blocks;
}

/**
 * Turns whatever is stored (a valid content array, an empty array, or nothing
 * — plus the legacy columns) into a complete, valid ResumeContent. Never
 * returns []: a resume with no recoverable content gets the default starter set.
 */
export function normalizeContent(raw: unknown, legacy: LegacyResumeShape = {}): ResumeContent {
  if (Array.isArray(raw) && raw.length > 0) {
    const seen = new Set<string>();
    const blocks = raw.map((b) => sanitizeBlock(b, seen)).filter((b): b is ResumeSectionBlock => b != null);
    if (blocks.length > 0) return blocks;
  }
  const upgraded = legacyToContent(legacy);
  return upgraded.length > 0 ? upgraded : defaultStarterContent();
}

// ---------------------------------------------------------------------------
// content -> legacy columns projection (written alongside `content` so an app
// build still reading the legacy columns keeps working during the rollout).
// ---------------------------------------------------------------------------
export interface LegacyColumns {
  sections: Record<string, string>;
  education: { id: string; degree: string; institution: string; startYear: string; endYear: string; percentage: string }[];
  skills: { technical: string[]; soft: string[] };
  layout: { order: string[]; hidden: string[] };
}

function entryToText(e: ResumeEntry): string {
  const head = [e.title, e.subtitle, [e.startDate, e.endDate].filter(Boolean).join(" – ")].filter(Boolean).join(" · ");
  return [head, e.description].filter(Boolean).join("\n");
}

export function contentToLegacyColumns(content: ResumeContent): LegacyColumns {
  const sections: Record<string, string> = {};
  let education: LegacyColumns["education"] = [];
  const skills: LegacyColumns["skills"] = { technical: [], soft: [] };
  const order: string[] = [];
  const hidden: string[] = [];

  for (const block of content) {
    if ((LEGACY_ORDER as string[]).includes(block.type)) {
      order.push(block.type);
      if (block.hidden) hidden.push(block.type);
    }
    if (block.type === "education" && block.variant === "entries") {
      education = (block.entries ?? [])
        .filter((e) => e.title.trim() || e.subtitle.trim())
        .map((e) => ({
          id: e.id,
          degree: e.title,
          institution: e.subtitle,
          startYear: e.startDate,
          endYear: e.endDate,
          percentage: (e.description.match(/([\d.]+)\s*%?/)?.[1] ?? "").trim(),
        }));
    } else if (block.type === "skills" && block.variant === "tags") {
      const groups = block.groups ?? [];
      skills.technical = groups.filter((g) => !/soft/i.test(g.label)).flatMap((g) => g.items);
      skills.soft = groups.filter((g) => /soft/i.test(g.label)).flatMap((g) => g.items);
    } else if ((LEGACY_TEXT_KEYS as string[]).includes(block.type)) {
      sections[block.type] =
        block.variant === "text"
          ? block.text ?? ""
          : block.variant === "entries"
            ? (block.entries ?? []).map(entryToText).join("\n\n")
            : block.variant === "tags"
              ? (block.groups ?? []).map((g) => (g.label ? `${g.label}: ` : "") + g.items.join(", ")).join("\n")
              : (block.links ?? []).map((l) => [l.label, l.url].filter(Boolean).join(": ")).join("\n");
    }
  }
  return { sections, education, skills, layout: { order, hidden } };
}

// ---------------------------------------------------------------------------
// Pure block-list helpers used by the editor (add / duplicate / delete /
// move / rename / hide) — no React, unit-tested.
// ---------------------------------------------------------------------------
export function moveBlock(content: ResumeContent, id: string, dir: "up" | "down"): ResumeContent {
  const i = content.findIndex((b) => b.id === id);
  if (i === -1) return content;
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= content.length) return content;
  const next = [...content];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export function reorderBlocks(content: ResumeContent, fromId: string, toId: string): ResumeContent {
  if (fromId === toId) return content;
  const from = content.findIndex((b) => b.id === fromId);
  const to = content.findIndex((b) => b.id === toId);
  if (from === -1 || to === -1) return content;
  const next = [...content];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function duplicateBlock(content: ResumeContent, id: string): ResumeContent {
  const i = content.findIndex((b) => b.id === id);
  if (i === -1) return content;
  const src = content[i];
  const copy: ResumeSectionBlock = JSON.parse(JSON.stringify(src));
  copy.id = makeId();
  copy.heading = `${src.heading} (copy)`;
  copy.entries = copy.entries?.map((e) => ({ ...e, id: makeId("ent") }));
  copy.groups = copy.groups?.map((g) => ({ ...g, id: makeId("grp") }));
  copy.links = copy.links?.map((l) => ({ ...l, id: makeId("lnk") }));
  const next = [...content];
  next.splice(i + 1, 0, copy);
  return next;
}

export function deleteBlock(content: ResumeContent, id: string): ResumeContent {
  return content.filter((b) => b.id !== id);
}

export function updateBlock(content: ResumeContent, id: string, patch: Partial<ResumeSectionBlock>): ResumeContent {
  return content.map((b) => (b.id === id ? { ...b, ...patch } : b));
}

export function toggleBlockHidden(content: ResumeContent, id: string): ResumeContent {
  return content.map((b) => (b.id === id ? { ...b, hidden: !b.hidden } : b));
}

// ---------------------------------------------------------------------------
// Completion — deterministic, rule-based (not a guess). `completionItems`
// itemises the same checks so the editor can show a "✓ Personal / ⚠ Summary"
// list where each ⚠ jumps straight to the right section.
// ---------------------------------------------------------------------------

/** Where clicking a checklist item should take the editor. */
export type CompletionTarget = { kind: "personal" } | { kind: "block"; blockId: string } | { kind: "type"; sectionType: SectionType };

export interface CompletionItem {
  key: string;
  label: string;
  done: boolean;
  target: CompletionTarget;
}

/** The editor-jump target for the first block of any of `types` — or a "type" placeholder when none exists yet. Shared by the completion checklist and the ATS breakdown. */
export function sectionTarget(content: ResumeContent, types: SectionType[]): CompletionTarget {
  const block = content.find((b) => types.includes(b.type));
  return block ? { kind: "block", blockId: block.id } : { kind: "type", sectionType: types[0] };
}
const firstBlockTarget = sectionTarget;

/** URL-safe encode/decode of a CompletionTarget for the editor deep-link (`/edit?section=…`). */
export function encodeSectionTarget(target: CompletionTarget): string {
  if (target.kind === "personal") return "personal";
  if (target.kind === "block") return `block:${target.blockId}`;
  return `type:${target.sectionType}`;
}
export function decodeSectionTarget(raw: string | null | undefined): CompletionTarget | null {
  if (!raw) return null;
  if (raw === "personal") return { kind: "personal" };
  if (raw.startsWith("block:")) return { kind: "block", blockId: raw.slice(6) };
  if (raw.startsWith("type:")) {
    const t = raw.slice(5) as SectionType;
    return SECTION_TYPES.includes(t) ? { kind: "type", sectionType: t } : null;
  }
  return null;
}

export function completionItems(content: ResumeContent, personal: ResumePersonalDetails): CompletionItem[] {
  const visible = content.filter((b) => !b.hidden);
  const hasContent = (types: SectionType[]) =>
    visible.some(
      (b) =>
        types.includes(b.type) &&
        ((b.text ?? "").trim().length > 20 ||
          (b.entries ?? []).some((e) => e.title.trim() || e.description.trim()) ||
          (b.groups ?? []).some((g) => g.items.length > 0) ||
          (b.links ?? []).some((l) => l.url.trim())),
    );

  return [
    { key: "name", label: "Full name", done: Boolean(personal.fullName?.trim()), target: { kind: "personal" } },
    { key: "title", label: "Professional title", done: Boolean(personal.jobTitle?.trim()), target: { kind: "personal" } },
    { key: "email", label: "Email", done: Boolean(personal.email?.trim()), target: { kind: "personal" } },
    { key: "contact", label: "Phone or location", done: Boolean(personal.phone?.trim() || personal.location?.trim()), target: { kind: "personal" } },
    { key: "links", label: "LinkedIn or portfolio", done: Boolean(personal.linkedin?.trim() || personal.website?.trim() || personal.github?.trim()), target: { kind: "personal" } },
    { key: "summary", label: "Professional summary", done: hasContent(["summary", "objective"]), target: firstBlockTarget(content, ["summary", "objective"]) },
    { key: "experience", label: "Experience or projects", done: hasContent(["experience", "internships", "projects"]), target: firstBlockTarget(content, ["experience", "internships", "projects"]) },
    { key: "education", label: "Education", done: hasContent(["education"]), target: firstBlockTarget(content, ["education"]) },
    { key: "skills", label: "Skills", done: hasContent(["skills"]), target: firstBlockTarget(content, ["skills"]) },
  ];
}

export function computeCompletion(content: ResumeContent, personal: ResumePersonalDetails): number {
  const items = completionItems(content, personal);
  return Math.round((items.filter((i) => i.done).length / items.length) * 100);
}
