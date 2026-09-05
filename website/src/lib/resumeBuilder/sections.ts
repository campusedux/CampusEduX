// Section ordering/visibility for the website Resume Editor. Only these 9
// sections are manageable — Personal Details is always shown first and isn't
// reorderable/hideable, matching the mobile builder's fixed nav.

export const MANAGEABLE_SECTIONS = [
  "summary",
  "education",
  "skills",
  "experience",
  "projects",
  "certifications",
  "achievements",
  "languages",
  "references",
] as const;
export type ManageableSectionKey = (typeof MANAGEABLE_SECTIONS)[number];

export const SECTION_LABELS: Record<ManageableSectionKey, string> = {
  summary: "Professional Summary",
  education: "Education",
  skills: "Skills",
  experience: "Work Experience",
  projects: "Projects",
  certifications: "Certifications",
  achievements: "Achievements",
  languages: "Languages",
  references: "References",
};

export interface ResumeLayout {
  order: ManageableSectionKey[];
  hidden: ManageableSectionKey[];
}

const DEFAULT_ORDER: ManageableSectionKey[] = [...MANAGEABLE_SECTIONS];

function isManageable(key: unknown): key is ManageableSectionKey {
  return typeof key === "string" && (MANAGEABLE_SECTIONS as readonly string[]).includes(key);
}

/**
 * Turns whatever is stored in resumes_builder.layout (possibly `{}` for a
 * resume created before this column existed, or missing a section added to
 * MANAGEABLE_SECTIONS after the resume was last saved) into a complete,
 * valid layout — every manageable section appears in `order` exactly once.
 */
export function normalizeLayout(raw: unknown): ResumeLayout {
  const source = (raw ?? {}) as { order?: unknown; hidden?: unknown };
  const rawOrder = Array.isArray(source.order) ? source.order.filter(isManageable) : [];
  const order = [...rawOrder, ...DEFAULT_ORDER.filter((key) => !rawOrder.includes(key))];
  const hidden = Array.isArray(source.hidden) ? source.hidden.filter(isManageable) : [];
  return { order, hidden };
}

/** Swaps a section with its neighbour; a no-op at either end of the list. */
export function moveSection(order: ManageableSectionKey[], key: ManageableSectionKey, direction: "up" | "down"): ManageableSectionKey[] {
  const index = order.indexOf(key);
  if (index === -1) return order;
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= order.length) return order;
  const next = [...order];
  [next[index], next[swapWith]] = [next[swapWith], next[index]];
  return next;
}

export function toggleHidden(hidden: ManageableSectionKey[], key: ManageableSectionKey): ManageableSectionKey[] {
  return hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key];
}
