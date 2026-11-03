import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabase } from "@/lib/supabase/server";
import { publicRevisionScopes, readPublicContentRevision } from "@/lib/publicContentRevision";
import { buildCsp } from "@/lib/csp";

/** With src/app, Next discovers middleware here. Only the requested CSP is
 * activated; the pre-existing root session-refresh implementation is unchanged.
 */
export async function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  const route = request.nextUrl.pathname;
  headers.set("x-public-content-route", route);
  let unavailable = false;
  const scopes = publicRevisionScopes(route);
  if ((request.method === "GET" || request.method === "HEAD") && scopes.length) {
    try {
      const client = getPublicSupabase({ fresh: true });
      if (!client) throw new Error("Public content is unavailable");
      // Run before Next can commit a streamed 200. Render/fill checks remain intact.
      await Promise.all(scopes.map(scope => readPublicContentRevision(client, scope, route)));
    } catch { unavailable = true; }
  }
  const adsEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
  let csp: string | undefined;
  if (adsEnabled) {
    const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
    csp = buildCsp({ nonce, adsEnabled: true });
    headers.set("x-nonce", nonce);
    headers.set("content-security-policy", csp);
  }
  const response = unavailable
    ? new NextResponse(request.method === "HEAD" ? null : '<!doctype html><html lang="en-IN"><head><title>Temporarily unavailable | CampusEduX</title><meta name="robots" content="noindex"></head><body><main><h1>Temporarily unavailable</h1><p>Please retry shortly.</p></main></body></html>', {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "5", "Cache-Control": "no-store" },
    })
    : NextResponse.next({ request: { headers } });
  if (csp) response.headers.set("Content-Security-Policy", csp);
  if (!unavailable && (adsEnabled || scopes.length)) response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
