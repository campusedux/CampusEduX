import type { ResumeContent, SectionType, SectionVariant } from "./content";
import type { ResumePersonalDetails } from "./types";

/**
 * The single "what does this resume contain, in what order" model. The HTML
 * live preview, the PDF export and the DOCX export all render from this —
 * they never re-walk `content` themselves — so they can't drift apart.
 *
 * Every block carries a flat `lines` projection AND (for entry sections) a
 * structured `entries` list: renderers that can lay out entries nicely use
 * `entries`; the rest fall back to `lines`.
 */

export interface ResumeRenderInput {
  personalDetails: ResumePersonalDetails;
  content: ResumeContent;
}

export interface RenderEntry {
  title: string;
  subtitle: string;
  /** "Location · Jan 2023 – Present" — already assembled. */
  meta: string;
  url: string;
  /** description split into clean lines, leading bullet glyphs stripped. */
  bullets: string[];
  tags: string[];
}

export interface ResumeRenderBlock {
  id: string;
  type: SectionType;
  heading: string;
  variant: SectionVariant;
  /** always populated — flat text used by DOCX/PDF and the drift-guard tests. */
  lines: string[];
  /** only for variant "entries" */
  entries?: RenderEntry[];
  /** only for variant "tags" */
  chips?: string[];
  /** only for variant "links" */
  links?: { label: string; url: string }[];
}

export interface ResumeRenderModel {
  fullName: string;
  jobTitle: string;
  contactLine: string;
  blocks: ResumeRenderBlock[];
}

const BULLET_RE = /^\s*[•\-–*·]\s+/;

function toBullets(description: string): string[] {
  return description
    .split("\n")
    .map((l) => l.replace(BULLET_RE, "").trim())
    .filter(Boolean);
}

function entryMeta(location: string, startDate: string, endDate: string): string {
  const dates = [startDate, endDate].filter(Boolean).join(" – ");
  return [location, dates].filter(Boolean).join(" · ");
}

export function buildResumeRenderModel(input: ResumeRenderInput): ResumeRenderModel {
  const p = input.personalDetails;
  const contactLine = [p.email, p.phone, p.location, p.linkedin, p.github, p.website]
    .map((v) => (v ?? "").trim())
    .filter(Boolean)
    .join(" · ");

  const blocks: ResumeRenderBlock[] = [];

  for (const block of input.content) {
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
      const chips = groups.flatMap((g) => g.items);
      const lines = groups.map((g) => (g.label ? `${g.label}: ` : "") + g.items.join(", "));
      blocks.push({ id: block.id, type: block.type, heading: block.heading, variant: "tags", lines, chips });
      continue;
    }

    if (block.variant === "links") {
      const links = (block.links ?? []).filter((l) => l.url.trim() || l.label.trim());
      if (links.length === 0) continue;
      blocks.push({
        id: block.id,
        type: block.type,
        heading: block.heading,
        variant: "links",
        links: links.map((l) => ({ label: l.label.trim(), url: l.url.trim() })),
        lines: links.map((l) => (l.label ? `${l.label}: ${l.url}` : l.url)),
      });
      continue;
    }

    // entries
    const rawEntries = (block.entries ?? []).filter((e) => e.title.trim() || e.subtitle.trim() || e.description.trim());
    if (rawEntries.length === 0) continue;
    const entries: RenderEntry[] = rawEntries.map((e) => ({
      title: e.title.trim(),
      subtitle: e.subtitle.trim(),
      meta: entryMeta(e.location.trim(), e.startDate.trim(), e.endDate.trim()),
      url: e.url.trim(),
      bullets: toBullets(e.description),
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

  return { fullName: p.fullName || "Your Name", jobTitle: p.jobTitle, contactLine, blocks };
}
