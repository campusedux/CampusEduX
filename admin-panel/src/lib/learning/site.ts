/** Public website origin, for "Preview on site" links from the Learning admin.
 *  Falls back to the production domain; set NEXT_PUBLIC_WEBSITE_URL to override
 *  (e.g. http://localhost:3001 when running the website locally). */
export const WEBSITE_URL = (process.env.NEXT_PUBLIC_WEBSITE_URL ?? 'https://campusedux.app').replace(/\/$/, '');

export function learningGridUrl(slug: string): string {
  return `${WEBSITE_URL}/learning/${slug}`;
}

export function learningTopicUrl(gridSlug: string, topicSlug: string): string {
  return `${WEBSITE_URL}/learning/${gridSlug}/${topicSlug}`;
}
