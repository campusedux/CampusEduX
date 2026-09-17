import { ImageResponse } from "next/og";
import { BRAND_ICON_SIZE, BrandIconMark } from "@/lib/brandIcon";

// Compatibility path for browsers/crawlers that request /favicon.ico
// directly instead of following the <link rel="icon"> that app/icon.tsx
// generates. Next's static favicon.ico convention only serves a literal
// binary file placed at app/favicon.ico, which this repo doesn't have and
// isn't adding (no new artwork) — so this ships as a route handler under a
// "favicon.ico" folder instead. That's a normal dynamic route, not the
// static-file convention, so it doesn't affect /icon in any way. Unlike
// icon.tsx, a route handler only accepts HTTP-method exports (plus a small
// fixed set of route-config options) — `contentType`/`size` aren't valid
// here; ImageResponse sets its own Content-Type header already.
export async function GET() {
  return new ImageResponse(<BrandIconMark />, { ...BRAND_ICON_SIZE });
}
