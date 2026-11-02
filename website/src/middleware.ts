import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "@/lib/csp";

/** With src/app, Next discovers middleware here. Only the requested CSP is
 * activated; the pre-existing root session-refresh implementation is unchanged.
 */
export function middleware(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_ADSENSE_ENABLED !== "true") return NextResponse.next();
  const headers = new Headers(request.headers);
  // Replace caller-supplied values; each document needs a fresh random nonce.
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const csp = buildCsp({ nonce, adsEnabled: true });
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
