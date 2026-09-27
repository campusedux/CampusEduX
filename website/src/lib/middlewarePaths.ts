// Public, cookie-free content. A GET/HEAD here never reads the session on the
// server (the header/drawer fetch `/api/session` client-side, which IS still
// refreshed), so running `supabase.auth.getUser()` for it — including for every
// crawler hit — only adds an Auth round-trip. Non-GET requests (Server Actions
// posted from these pages, e.g. job apply / wishlist) still refresh the session.
export const PUBLIC_GET_PREFIXES = [
  "/learning",
  "/coding-problems",
  "/practice/interview-questions",
  "/practice/problems",
  "/blog",
  "/jobs",
  "/projects",
  "/sitemap.xml",
  "/sitemaps",
  "/robots.txt",
  "/api/announcements",
  "/api/search",
];

export function isPublicGet(method: string, pathname: string): boolean {
  if (method !== "GET" && method !== "HEAD") return false;
  return PUBLIC_GET_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
