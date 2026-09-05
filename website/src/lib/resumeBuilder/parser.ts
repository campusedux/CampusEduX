import type { ResumeEducationEntry, ResumeFreeformSectionKey } from "./types";

export interface ParsedContactInfo {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  github: string | null;
  website: string | null;
}

export interface ParsedResumeResult {
  contact: ParsedContactInfo;
  sections: Partial<Record<ResumeFreeformSectionKey, string>>;
  education: ResumeEducationEntry[];
  skills: string[];
  /** Text the heuristics couldn't confidently place under a known heading — always surfaced, never silently dropped. */
  unrecognizedText: string;
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RE = /(\+?\d{1,3}[\s.-]?)?(\(?\d{3,5}\)?[\s.-]?){2,3}\d{3,4}/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-z0-9-]+\/?/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-z0-9-]+\/?/i;
const GENERIC_URL_RE = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s,]*)?/gi;
const YEAR_RANGE_RE = /(19|20)\d{2}\s*[-–—to]{1,4}\s*((19|20)\d{2}|present|current)/i;
const YEAR_RE = /(19|20)\d{2}/g;

const HEADING_PATTERNS: { key: ResumeFreeformSectionKey | "education" | "skills"; patterns: RegExp[] }[] = [
  { key: "summary", patterns: [/^(professional\s+)?summary$/i, /^objective$/i, /^career\s+objective$/i, /^profile$/i, /^about(\s+me)?$/i] },
  { key: "experience", patterns: [/^(work\s+|professional\s+)?experience$/i, /^employment(\s+history)?$/i, /^work\s+history$/i] },
  { key: "education", patterns: [/^education(al\s+background)?$/i, /^academic\s+background$/i] },
  { key: "skills", patterns: [/^(technical\s+|core\s+)?skills$/i, /^skills\s*(&|and)\s*abilities$/i, /^technologies$/i] },
  { key: "projects", patterns: [/^(personal\s+|academic\s+)?projects?$/i] },
  { key: "certifications", patterns: [/^certifications?$/i, /^licenses?(\s*(and|&)\s*certifications)?$/i] },
  { key: "achievements", patterns: [/^achievements?$/i, /^awards?(\s*(and|&)\s*achievements)?$/i, /^honou?rs?$/i] },
  { key: "languages", patterns: [/^languages?$/i] },
  { key: "references", patterns: [/^references?$/i] },
];

/** A line is treated as a section heading when it's short and matches a known keyword pattern — long lines never accidentally swallow real content as a "heading". */
function matchHeading(line: string): (typeof HEADING_PATTERNS)[number]["key"] | null {
  const trimmed = line.trim().replace(/[:：]+$/, "");
  if (!trimmed || trimmed.length > 40) return null;
  for (const { key, patterns } of HEADING_PATTERNS) {
    if (patterns.some((p) => p.test(trimmed))) return key;
  }
  return null;
}

function extractContact(text: string): ParsedContactInfo {
  const email = text.match(EMAIL_RE)?.[0] ?? null;
  const linkedin = text.match(LINKEDIN_RE)?.[0] ?? null;
  const github = text.match(GITHUB_RE)?.[0] ?? null;

  // Scan for a portfolio/website URL with the email address removed first —
  // otherwise "rohan.verma" from "rohan.verma@email.com" itself matches the
  // generic domain-like pattern before the real website ever gets a look in.
  const textWithoutEmail = email ? text.replace(email, " ") : text;
  const genericUrls = textWithoutEmail.match(GENERIC_URL_RE) ?? [];
  const website = genericUrls.find((u) => !/linkedin\.com|github\.com/i.test(u)) ?? null;

  const phone = text.match(PHONE_RE)?.[0]?.trim() ?? null;

  // Best-effort name guess: the first non-empty line, when it doesn't look like contact info itself.
  const firstLine = text.split("\n").map((l) => l.trim()).find((l) => l.length > 0 && l.length < 60);
  const fullName = firstLine && !EMAIL_RE.test(firstLine) && !PHONE_RE.test(firstLine) ? firstLine : null;

  return { fullName, email, phone, linkedin, github, website };
}

/** True when a line (from the pre-heading header block) is contact info already captured in `contact` — kept out of unrecognizedText so it isn't shown twice. */
function isContactLine(line: string, contact: ParsedContactInfo): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (contact.fullName && trimmed === contact.fullName) return true;
  return EMAIL_RE.test(trimmed) || PHONE_RE.test(trimmed) || LINKEDIN_RE.test(trimmed) || GITHUB_RE.test(trimmed);
}

/** Best-effort: a line with a year range is treated as one entry; everything before the range is split into degree/institution guesses. Lines without a year range are kept as-is for manual review rather than dropped. */
function parseEducationBlock(block: string): { entries: ResumeEducationEntry[]; leftover: string } {
  const entries: ResumeEducationEntry[] = [];
  const leftoverLines: string[] = [];
  let counter = 0;

  for (const rawLine of block.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const rangeMatch = line.match(YEAR_RANGE_RE);
    if (!rangeMatch) {
      leftoverLines.push(line);
      continue;
    }
    const years = line.match(YEAR_RE) ?? [];
    const remainder = line
      .replace(rangeMatch[0], "")
      .replace(/[,|•·-]+$/, "")
      .replace(/^[,|•·-]+/, "")
      .trim();
    const parts = remainder.split(/[,|•]/).map((p) => p.trim()).filter(Boolean);

    entries.push({
      id: `parsed-${counter++}`,
      degree: parts[0] ?? remainder,
      institution: parts[1] ?? "",
      startYear: years[0] ?? "",
      endYear: /present|current/i.test(rangeMatch[0]) ? "Present" : years[1] ?? "",
      percentage: "",
    });
  }

  return { entries, leftover: leftoverLines.join("\n") };
}

function parseSkillsBlock(block: string): string[] {
  return block
    .split(/[\n,•|]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length < 60);
}

/**
 * Heuristic (not AI) section detection over raw extracted text. Never
 * throws on unrecognized formatting — anything that can't be confidently
 * placed under a known heading falls into `unrecognizedText`, which the
 * review UI always shows so nothing from the uploaded file is silently lost.
 */
export function parseResumeText(rawText: string): ParsedResumeResult {
  const contact = extractContact(rawText);
  const lines = rawText.split("\n");

  const blocks: { key: (typeof HEADING_PATTERNS)[number]["key"] | "unrecognized"; lines: string[] }[] = [];
  let current: (typeof blocks)[number] = { key: "unrecognized", lines: [] };
  blocks.push(current);

  for (const line of lines) {
    const heading = matchHeading(line);
    if (heading) {
      current = { key: heading, lines: [] };
      blocks.push(current);
    } else {
      current.lines.push(line);
    }
  }

  const sections: Partial<Record<ResumeFreeformSectionKey, string>> = {};
  const unrecognizedParts: string[] = [];
  let education: ResumeEducationEntry[] = [];
  let skills: string[] = [];

  blocks.forEach((block, index) => {
    // Only the very first block can be the pre-heading header (name/contact
    // line) — filter those lines out here so they aren't duplicated below.
    if (block.key === "unrecognized" && index === 0) {
      block.lines = block.lines.filter((line) => !isContactLine(line, contact));
    }
  });

  for (const block of blocks) {
    const text = block.lines.join("\n").trim();
    if (!text) continue;

    if (block.key === "unrecognized") {
      unrecognizedParts.push(text);
    } else if (block.key === "education") {
      const { entries, leftover } = parseEducationBlock(text);
      education = education.concat(entries);
      if (leftover) unrecognizedParts.push(`[Education — unparsed lines]\n${leftover}`);
    } else if (block.key === "skills") {
      skills = skills.concat(parseSkillsBlock(text));
    } else {
      sections[block.key] = sections[block.key] ? `${sections[block.key]}\n${text}` : text;
    }
  }

  return { contact, sections, education, skills, unrecognizedText: unrecognizedParts.join("\n\n").trim() };
}
