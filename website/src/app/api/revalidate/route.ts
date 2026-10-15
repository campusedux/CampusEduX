import { revalidatePath, revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { isAllowedContentTag, learningTag } from "@/lib/learningTags";

export const runtime = "nodejs";

/**
 * On-demand cache invalidation for the public catalog + Learning pages.
 *
 * Detail pages (`/projects/[id]`, `/jobs/[id]`, `/learning/*`, …) are ISR and
 * their data reads go through `unstable_cache` with tags (see `src/lib/cache.ts`
 * / `src/lib/learning.ts`). Everything refreshes on its own `revalidate`
 * interval; this endpoint lets the admin panel (or a Supabase DB webhook) push
 * a change through immediately.
 *
 *   POST /api/revalidate
 *   x-revalidate-secret: <REVALIDATE_SECRET>
 *   { "tags": ["projects"] }                 // bust cached project data everywhere
 *   { "path": "/projects/tr-2" }             // re-render one page
 *   { "path": "/learning", "type": "layout" }// re-render a subtree
 *
 * Granular Learning tags (see `lib/learningTags.ts`): learning:list,
 * learning:sitemap, learning:grid:<grid>, learning:topic:<grid>:<topic>,
 * learning:coding:<slug>; practice:problem:<slug>; interview:category:<cat>;
 * interview:topic:<cat>:<topic>. `learning:sitemap` also re-renders /sitemap.xml.
 *
 * Known tags: projects, jobs, categories, companies, home, learning, practice,
 * premium, resume-templates, cms, blog, interview-questions.
 *
 * No secret configured → disabled (404). Wrong secret → 401. Never returns
 * data, never mutates anything but the cache.
 */

const ALLOWED_TAGS = new Set([
  "projects",
  "jobs",
  "categories",
  "companies",
  "home",
  "learning",
  "practice",
  "premium",
  "resume-templates",
  "cms",
  "blog",
  "interview-questions",
]);

/** Constant-time comparison; a length mismatch is rejected up front. */
function tokenMatches(given: string | null, expected: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const MAX_TAGS = 50;

export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ error: "not enabled" }, { status: 404 });
  if (!tokenMatches(req.headers.get("x-revalidate-secret"), secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { path?: unknown; tags?: unknown; type?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid revalidation request" }, { status: 400 });
  }
  const prefixes = ["/learning", "/practice", "/projects", "/jobs", "/blog", "/premium", "/resume", "/faq", "/sitemap.xml", "/sitemaps/"];
  const path = typeof body.path === "string" ? body.path : "";
  const validPath = typeof body.path === "string" && path.length <= 200 &&
    prefixes.some((prefix) => path === prefix || (prefix.endsWith("/") ? path.startsWith(prefix) : path.startsWith(`${prefix}/`))) &&
    !path.includes("//") && !path.includes("..") && !path.includes("%") && !path.includes("\\") && !path.includes("?") && !path.includes("#");
  const validTags = Array.isArray(body.tags) && body.tags.length > 0 && body.tags.length <= MAX_TAGS &&
    body.tags.every((tag) => typeof tag === "string" && (ALLOWED_TAGS.has(tag) || isAllowedContentTag(tag)));
  if ((body.path !== undefined && !validPath) || (body.tags !== undefined && !validTags) ||
      (body.type !== undefined && body.type !== "page" && body.type !== "layout") ||
      (!validPath && !validTags)) {
    return NextResponse.json({ error: "Invalid revalidation request" }, { status: 400 });
  }
  const done: { tags: string[]; paths: string[] } = { tags: [], paths: [] };

  if (Array.isArray(body.tags)) {
    for (const t of body.tags) {
      if (typeof t === "string" && (ALLOWED_TAGS.has(t) || isAllowedContentTag(t))) {
        revalidateTag(t);
        done.tags.push(t);
        if (t === learningTag.sitemap) {
          revalidatePath("/sitemap.xml");
          done.paths.push("/sitemap.xml");
        }
      }
    }
  }

  if (validPath) {
    const type = body.type === "layout" ? "layout" : "page";
    revalidatePath(path, type);
    done.paths.push(path);
  }

  return NextResponse.json({ revalidated: true, ...done, at: Date.now() });
}
