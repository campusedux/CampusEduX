import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

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
 * Known tags: projects, jobs, categories, companies, home, learning, practice,
 * premium, resume-templates, cms, blog.
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
]);

export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ error: "not enabled" }, { status: 404 });
  if (req.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { path?: unknown; tags?: unknown; type?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    /* empty / invalid body → fall through to the /learning default below */
  }

  const done: { tags: string[]; paths: string[] } = { tags: [], paths: [] };

  if (Array.isArray(body.tags)) {
    for (const t of body.tags) {
      if (typeof t === "string" && ALLOWED_TAGS.has(t)) {
        revalidateTag(t);
        done.tags.push(t);
      }
    }
  }

  if (typeof body.path === "string" && body.path.startsWith("/")) {
    const type = body.type === "layout" ? "layout" : "page";
    revalidatePath(body.path, type);
    done.paths.push(body.path);
  }

  // Back-compat: a bare call with no tags and no path still refreshes /learning.
  if (done.tags.length === 0 && done.paths.length === 0) {
    revalidatePath("/learning", "layout");
    done.paths.push("/learning");
  }

  return NextResponse.json({ revalidated: true, ...done, at: Date.now() });
}
