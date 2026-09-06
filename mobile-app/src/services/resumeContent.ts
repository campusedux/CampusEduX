// Mirror of the website's lib/resumeBuilder/content.ts + renderModel.ts pure
// logic. `resumes_builder.content` (an ordered ResumeSectionBlock[]) is the
// source of truth on both platforms; the legacy columns are kept only so an
// un-migrated row / an older app build can be upgraded on read.

import type {
  ResumeContent,
  ResumePersonalDetails,
  ResumeSectionBlock,
  ResumeSectionEntry,
  ResumeSectionType,
  ResumeSectionVariant,
  ResumeTagGroup,
} from "@/types";

export const RESUME_SECTION_TYPES: ResumeSectionType[] = [
  "summary", "objective", "experience", "internships", "education", "skills", "projects",
  "certifications", "achievements", "awards", "publications", "research", "volunteer",
  "leadership", "languages", "interests", "coding_profiles", "social_links", "references", "custom",
];

const VARIANTS: ResumeSectionVariant[] = ["text", "entries", "tags", "links"];

const SECTION_LABELS: Record<ResumeSectionType, string> = {
  summary: "Professional Summary", objective: "Career Objective", experience: "Work Experience",
  internships: "Internships", education: "Education", skills: "Technical Skills", projects: "Projects",
  certifications: "Certifications", achievements: "Achievements", awards: "Awards", publications: "Publications",
  research: "Research", volunteer: "Volunteer Experience", leadership: "Leadership", languages: "Languages",
  interests: "Interests", coding_profiles: "Coding Profiles", social_links: "Links", references: "References",
  custom: "Custom Section",
};

const DEFAULT_VARIANT: Record<ResumeSectionType, ResumeSectionVariant> = {
  summary: "text", objective: "text", experience: "entries", internships: "entries", education: "entries",
  skills: "tags", projects: "entries", certifications: "entries", achievements: "text", awards: "entries",
  publications: "entries", research: "entries", volunteer: "entries", leadership: "entries", languages: "tags",
  interests: "tags", coding_profiles: "links", social_links: "links", references: "text", custom: "text",
};

let idCounter = 0;
export function makeId(prefix = "blk"): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

export function emptyEntry(): ResumeSectionEntry {
  return { id: makeId("ent"), title: "", subtitle: "", location: "", startDate: "", endDate: "", description: "", url: "", tags: [] };
}

export function makeBlock(type: ResumeSectionType, heading?: string): ResumeSectionBlock {
  const variant = DEFAULT_VARIANT[type];
  const block: ResumeSectionBlock = { id: makeId(), type, heading: heading ?? SECTION_LABELS[type], variant, hidden: false };
  if (variant === "text") block.text = "";
  else if (variant === "entries") block.entries = [emptyEntry()];
  else if (variant === "tags") block.groups = [{ id: makeId("grp"), label: type === "skills" ? "Technical" : "", items: [] }];
  else block.links = [{ id: makeId("lnk"), label: "", url: "" }];
  return block;
}

export function defaultStarterContent(): ResumeContent {
  return [makeBlock("summary"), makeBlock("experience"), makeBlock("education"), makeBlock("skills"), makeBlock("projects")];
}

const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.map(str).map((s) => s.trim()).filter(Boolean) : []);

function sanitizeEntry(raw: unknown): ResumeSectionEntry {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: str(r.id) || makeId("ent"),
    title: str(r.title), subtitle: str(r.subtitle), location: str(r.location),
    startDate: str(r.startDate), endDate: str(r.endDate), description: str(r.description),
    url: str(r.url), tags: strArr(r.tags),
  };
}

function sanitizeBlock(raw: unknown, seen: Set<string>): ResumeSectionBlock | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const type = (RESUME_SECTION_TYPES.includes(r.type as ResumeSectionType) ? r.type : "custom") as ResumeSectionType;
  const variant = (VARIANTS.includes(r.variant as ResumeSectionVariant) ? r.variant : DEFAULT_VARIANT[type]) as ResumeSectionVariant;
  let id = str(r.id) || makeId();
  while (seen.has(id)) id = makeId();
  seen.add(id);
  const block: ResumeSectionBlock = { id, type, variant, heading: str(r.heading) || SECTION_LABELS[type], hidden: r.hidden === true };
  if (variant === "text") block.text = str(r.text);
  else if (variant === "entries") block.entries = Array.isArray(r.entries) ? r.entries.map(sanitizeEntry) : [];
  else if (variant === "tags") {
    const groups = Array.isArray(r.groups)
      ? (r.groups as unknown[]).map((g) => {
          const gr = (g ?? {}) as Record<string, unknown>;
          return { id: str(gr.id) || makeId("grp"), label: str(gr.label), items: strArr(gr.items) };
        })
      : [];
    block.groups = groups.length > 0 ? groups : [{ id: makeId("grp"), label: type === "skills" ? "Technical" : "", items: [] }];
  } else {
    block.links = Array.isArray(r.links)
      ? (r.links as unknown[]).map((l) => {
          const lr = (l ?? {}) as Record<string, unknown>;
          return { id: str(lr.id) || makeId("lnk"), label: str(lr.label), url: str(lr.url) };
        })
      : [];
  }
  return block;
}

const LEGACY_ORDER: ResumeSectionType[] = ["summary", "education", "skills", "experience", "projects", "certifications", "achievements", "languages", "references"];
const LEGACY_TEXT_KEYS: ResumeSectionType[] = ["summary", "experience", "projects", "certifications", "achievements", "languages", "references"];

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

  const rawOrder = Array.isArray(layout.order) ? (layout.order as unknown[]).map(str) : [];
  const order = [...rawOrder.filter((k) => (LEGACY_ORDER as string[]).includes(k)), ...LEGACY_ORDER.filter((k) => !rawOrder.includes(k))] as ResumeSectionType[];
  const hidden = new Set(Array.isArray(layout.hidden) ? (layout.hidden as unknown[]).map(str) : []);

  const blocks: ResumeContent = [];
  for (const key of order) {
    if (key === "education") {
      if (educationArr.length === 0) continue;
      const entries: ResumeSectionEntry[] = educationArr.map((e) => {
        const r = (e ?? {}) as Record<string, unknown>;
        return {
          id: str(r.id) || makeId("ent"),
          title: str(r.degree), subtitle: str(r.institution), location: "",
          startDate: str(r.startYear), endDate: str(r.endYear),
          description: str(r.percentage) ? `Score: ${str(r.percentage)}` : "", url: "", tags: [],
        };
      });
      blocks.push({ id: makeId(), type: "education", variant: "entries", heading: SECTION_LABELS.education, hidden: hidden.has("education"), entries });
      continue;
    }
    if (key === "skills") {
      const technical = strArr(skills.technical);
      const soft = strArr(skills.soft);
      if (technical.length === 0 && soft.length === 0) continue;
      const groups: ResumeTagGroup[] = [];
      if (technical.length) groups.push({ id: makeId("grp"), label: "Technical", items: technical });
      if (soft.length) groups.push({ id: makeId("grp"), label: "Soft", items: soft });
      blocks.push({ id: makeId(), type: "skills", variant: "tags", heading: SECTION_LABELS.skills, hidden: hidden.has("skills"), groups });
      continue;
    }
    if ((LEGACY_TEXT_KEYS as string[]).includes(key)) {
      const text = str(sections[key]).trim();
      if (!text) continue;
      blocks.push({ id: makeId(), type: key, variant: "text", heading: SECTION_LABELS[key], hidden: hidden.has(key), text: str(sections[key]) });
    }
  }
  return blocks;
}

/** Never returns [] — a resume with nothing recoverable gets the default starter set. */
export function normalizeResumeContent(raw: unknown, legacy: LegacyResumeShape = {}): ResumeContent {
  if (Array.isArray(raw) && raw.length > 0) {
    const seen = new Set<string>();
    const blocks = raw.map((b) => sanitizeBlock(b, seen)).filter((b): b is ResumeSectionBlock => b != null);
    if (blocks.length > 0) return blocks;
  }
  const upgraded = legacyToContent(legacy);
  return upgraded.length > 0 ? upgraded : defaultStarterContent();
}

export interface LegacyColumns {
  sections: Record<string, string>;
  education: { id: string; degree: string; institution: string; startYear: string; endYear: string; percentage: string }[];
  skills: { technical: string[]; soft: string[] };
  layout: { order: string[]; hidden: string[] };
}

function entryToText(e: ResumeSectionEntry): string {
  const head = [e.title, e.subtitle, [e.startDate, e.endDate].filter(Boolean).join(" – ")].filter(Boolean).join(" · ");
  return [head, e.description].filter(Boolean).join("\n");
}

export function contentToLegacyColumns(content: ResumeContent): LegacyColumns {
  const sections: Record<string, string> = {};
  let education: LegacyColumns["education"] = [];
  const skills: LegacyColumns["skills"] = { technical: [], soft: [] };
  const orderList: string[] = [];
  const hidden: string[] = [];

  for (const block of content) {
    if ((LEGACY_ORDER as string[]).includes(block.type)) {
      orderList.push(block.type);
      if (block.hidden) hidden.push(block.type);
    }
    if (block.type === "education" && block.variant === "entries") {
      education = (block.entries ?? [])
        .filter((e) => e.title.trim() || e.subtitle.trim())
        .map((e) => ({
          id: e.id, degree: e.title, institution: e.subtitle, startYear: e.startDate, endYear: e.endDate,
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
  return { sections, education, skills, layout: { order: orderList, hidden } };
}

// ---------------------------------------------------------------------------
// Surgical legacy-field -> content patchers. The mobile editor screens still
// edit the legacy shapes (a text section, the education list, the skills
// lists); these apply that one change onto `content` WITHOUT discarding any
// structured section the website may have added (e.g. Awards, Publications).
// ---------------------------------------------------------------------------
export function applyLegacyTextSection(content: ResumeContent, key: ResumeSectionType, text: string): ResumeContent {
  const idx = content.findIndex((b) => b.type === key);
  if (idx >= 0) {
    const block = content[idx];
    const next = [...content];
    next[idx] = block.variant === "text" ? { ...block, text } : { ...block, variant: "text", text };
    return next;
  }
  if (!text.trim()) return content;
  return [...content, { id: makeId(), type: key, variant: "text", heading: SECTION_LABELS[key], hidden: false, text }];
}

export function applyLegacyEducation(
  content: ResumeContent,
  education: { id?: string; degree: string; institution: string; startYear: string; endYear: string; percentage: string }[],
): ResumeContent {
  const entries: ResumeSectionEntry[] = education.map((e) => ({
    id: e.id || makeId("ent"),
    title: e.degree, subtitle: e.institution, location: "",
    startDate: e.startYear, endDate: e.endYear,
    description: e.percentage ? `Score: ${e.percentage}` : "", url: "", tags: [],
  }));
  const idx = content.findIndex((b) => b.type === "education");
  if (idx >= 0) {
    const next = [...content];
    next[idx] = { ...next[idx], variant: "entries", entries };
    return next;
  }
  return [...content, { id: makeId(), type: "education", variant: "entries", heading: SECTION_LABELS.education, hidden: false, entries }];
}

export function applyLegacySkills(content: ResumeContent, skills: { technical: string[]; soft: string[] }): ResumeContent {
  const groups: ResumeTagGroup[] = [];
  if (skills.technical.length) groups.push({ id: makeId("grp"), label: "Technical", items: skills.technical });
  if (skills.soft.length) groups.push({ id: makeId("grp"), label: "Soft", items: skills.soft });
  const idx = content.findIndex((b) => b.type === "skills");
  if (idx >= 0) {
    const next = [...content];
    next[idx] = { ...next[idx], variant: "tags", groups: groups.length ? groups : [{ id: makeId("grp"), label: "Technical", items: [] }] };
    return next;
  }
  if (groups.length === 0) return content;
  return [...content, { id: makeId(), type: "skills", variant: "tags", heading: SECTION_LABELS.skills, hidden: false, groups }];
}

// ---------------------------------------------------------------------------
// Render model — mirrors website renderModel.ts buildResumeRenderModel().
// ---------------------------------------------------------------------------
const BULLET_RE = /^\s*[•\-–*·]\s+/;

export interface ResumeRenderEntry {
  title: string;
  subtitle: string;
  meta: string;
  url: string;
  bullets: string[];
  tags: string[];
}

export interface ResumeRenderBlock {
  id: string;
  type: ResumeSectionType;
  heading: string;
  variant: ResumeSectionVariant;
  lines: string[];
  entries?: ResumeRenderEntry[];
  chips?: string[];
  links?: { label: string; url: string }[];
}

export function buildResumeRenderBlocks(content: ResumeContent): ResumeRenderBlock[] {
  const blocks: ResumeRenderBlock[] = [];
  for (const block of content) {
    if (block.hidden) continue;

    if (block.variant === "text") {
      const text = (block.text ?? "").trim();
      if (!text) continue;
      blocks.push({ id: block.id, type: block.type, heading: block.heading, variant: "text", lines: text.split("\n") });
      continue;
    }
    if (block.variant === "tags") {
      const groups = (block.groups ?? []).filter((g) => g.items.length > 0);
      if (groups.length === 0) continue;
      blocks.push({
        id: block.id, type: block.type, heading: block.heading, variant: "tags",
        chips: groups.flatMap((g) => g.items),
        lines: groups.map((g) => (g.label ? `${g.label}: ` : "") + g.items.join(", ")),
      });
      continue;
    }
    if (block.variant === "links") {
      const links = (block.links ?? []).filter((l) => l.url.trim() || l.label.trim());
      if (links.length === 0) continue;
      blocks.push({
        id: block.id, type: block.type, heading: block.heading, variant: "links",
        links: links.map((l) => ({ label: l.label.trim(), url: l.url.trim() })),
        lines: links.map((l) => (l.label ? `${l.label}: ${l.url}` : l.url)),
      });
      continue;
    }
    const raw = (block.entries ?? []).filter((e) => e.title.trim() || e.subtitle.trim() || e.description.trim());
    if (raw.length === 0) continue;
    const entries: ResumeRenderEntry[] = raw.map((e) => ({
      title: e.title.trim(),
      subtitle: e.subtitle.trim(),
      meta: [e.location.trim(), [e.startDate.trim(), e.endDate.trim()].filter(Boolean).join(" – ")].filter(Boolean).join(" · "),
      url: e.url.trim(),
      bullets: e.description.split("\n").map((l) => l.replace(BULLET_RE, "").trim()).filter(Boolean),
      tags: e.tags.filter(Boolean),
    }));
    const lines: string[] = [];
    for (const e of entries) {
      const head = [e.title, e.subtitle, e.meta].filter(Boolean).join(" · ");
      if (head) lines.push(head);
      if (e.tags.length) lines.push(e.tags.join(", "));
      for (const b of e.bullets) lines.push(`• ${b}`);
    }
    blocks.push({ id: block.id, type: block.type, heading: block.heading, variant: "entries", lines, entries });
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// Block-list helpers used by the mobile editor — mirror website content.ts.
// ---------------------------------------------------------------------------
export const RESUME_SECTION_LABELS = SECTION_LABELS;

export function makeSectionBlock(type: ResumeSectionType, heading?: string): ResumeSectionBlock {
  return makeBlock(type, heading);
}

export function moveBlock(content: ResumeContent, id: string, dir: "up" | "down"): ResumeContent {
  const i = content.findIndex((b) => b.id === id);
  if (i === -1) return content;
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= content.length) return content;
  const next = [...content];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export function duplicateBlock(content: ResumeContent, id: string): ResumeContent {
  const i = content.findIndex((b) => b.id === id);
  if (i === -1) return content;
  const copy: ResumeSectionBlock = JSON.parse(JSON.stringify(content[i]));
  copy.id = makeId();
  copy.heading = `${content[i].heading} (copy)`;
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
// Completion — mirrors website content.ts completionItems / computeCompletion.
// ---------------------------------------------------------------------------
export type CompletionTarget = { kind: "personal" } | { kind: "block"; blockId: string } | { kind: "type"; sectionType: ResumeSectionType };

export interface CompletionItem {
  key: string;
  label: string;
  done: boolean;
  target: CompletionTarget;
}

/** Editor-jump target for the first block of any of `types` — shared by the completion checklist and the ATS breakdown. */
export function sectionTarget(content: ResumeContent, types: ResumeSectionType[]): CompletionTarget {
  const block = content.find((b) => types.includes(b.type));
  return block ? { kind: "block", blockId: block.id } : { kind: "type", sectionType: types[0] };
}

export function completionItems(content: ResumeContent, personal: ResumePersonalDetails): CompletionItem[] {
  const visible = content.filter((b) => !b.hidden);
  const has = (types: ResumeSectionType[]) =>
    visible.some(
      (b) =>
        types.includes(b.type) &&
        ((b.text ?? "").trim().length > 20 ||
          (b.entries ?? []).some((e) => e.title.trim() || e.description.trim()) ||
          (b.groups ?? []).some((g) => g.items.length > 0) ||
          (b.links ?? []).some((l) => l.url.trim())),
    );
  const firstTarget = (types: ResumeSectionType[]): CompletionTarget => sectionTarget(content, types);
  return [
    { key: "name", label: "Full name", done: Boolean(personal.fullName?.trim()), target: { kind: "personal" } },
    { key: "title", label: "Professional title", done: Boolean(personal.jobTitle?.trim()), target: { kind: "personal" } },
    { key: "email", label: "Email", done: Boolean(personal.email?.trim()), target: { kind: "personal" } },
    { key: "contact", label: "Phone or location", done: Boolean(personal.phone?.trim() || personal.location?.trim()), target: { kind: "personal" } },
    { key: "links", label: "LinkedIn or portfolio", done: Boolean(personal.linkedin?.trim() || personal.website?.trim() || personal.github?.trim()), target: { kind: "personal" } },
    { key: "summary", label: "Professional summary", done: has(["summary", "objective"]), target: firstTarget(["summary", "objective"]) },
    { key: "experience", label: "Experience or projects", done: has(["experience", "internships", "projects"]), target: firstTarget(["experience", "internships", "projects"]) },
    { key: "education", label: "Education", done: has(["education"]), target: firstTarget(["education"]) },
    { key: "skills", label: "Skills", done: has(["skills"]), target: firstTarget(["skills"]) },
  ];
}

export function computeCompletion(content: ResumeContent, personal: ResumePersonalDetails): number {
  const items = completionItems(content, personal);
  return Math.round((items.filter((i) => i.done).length / items.length) * 100);
}

// ---------------------------------------------------------------------------
// Full render model — mirrors website renderModel.ts buildResumeRenderModel().
// ---------------------------------------------------------------------------
export interface ResumeRenderModel {
  fullName: string;
  jobTitle: string;
  contactLine: string;
  blocks: ResumeRenderBlock[];
}

export function buildResumeRenderModel(input: { personalDetails: ResumePersonalDetails; content: ResumeContent }): ResumeRenderModel {
  const p = input.personalDetails;
  const contactLine = [p.email, p.phone, p.location, p.linkedin, p.github, p.website]
    .map((v) => (v ?? "").trim())
    .filter(Boolean)
    .join(" · ");
  return {
    fullName: p.fullName || "Your Name",
    jobTitle: p.jobTitle,
    contactLine,
    blocks: buildResumeRenderBlocks(input.content),
  };
}

export { SECTION_LABELS };
