import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/**
 * On-demand cache invalidation for Learning pages.
 *
 * Every `/learning*` page is ISR (`revalidate = 300`), so admin changes appear
 * within 5 minutes with no redeploy. This endpoint lets the admin panel (or a
 * Supabase DB webhook) push a change through *immediately*:
 *
 *   POST /api/revalidate
 *   x-revalidate-secret: <REVALIDATE_SECRET>
 *   { "path": "/learning/java-tutorial" }   // optional; defaults to the whole /learning subtree
 *
 * No secret configured → the endpoint is disabled (404). Wrong secret → 401.
 * This never returns data and never mutates anything.
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ error: "not enabled" }, { status: 404 });
  if (req.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let path = "/learning";
  try {
    const body = (await req.json()) as { path?: unknown };
    if (typeof body?.path === "string" && body.path.startsWith("/learning")) path = body.path;
  } catch {
    /* empty / invalid body → default to the /learning subtree */
  }

  // Revalidate the requested Learning path (or the whole subtree). "layout"
  // scope also refreshes nested grid / topic pages under /learning.
  revalidatePath(path, path === "/learning" ? "layout" : "page");
  return NextResponse.json({ revalidated: true, path, at: Date.now() });
}
