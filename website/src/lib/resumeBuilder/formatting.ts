// Plain (non-"use server") helpers shared by the resumeBuilder Server Actions
// and their unit tests. A "use server" file may only export async functions,
// so these pure formatters live here instead of alongside the actions.

export interface ResumeProjectSnippetInput {
  title: string;
  description: string;
  technologyPreference: string;
}

/** Formats a finished custom project as a resume-ready snippet. */
export function formatProjectSnippet(project: ResumeProjectSnippetInput): string {
  const techSuffix = project.technologyPreference.trim() ? ` — ${project.technologyPreference.trim()}` : "";
  const description = project.description.trim();
  return `${project.title}${techSuffix}${description ? `\n${description}` : ""}`;
}

/** Appends a snippet to a freeform section's existing content, never replacing it. */
export function appendToFreeformContent(current: string, snippet: string): string {
  const trimmed = current.trim();
  return trimmed ? `${trimmed}\n\n${snippet}` : snippet;
}

/** A safe, lowercase-hyphenated download filename stem (no extension) from a resume title. */
export function slugifyFileName(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "resume";
}
