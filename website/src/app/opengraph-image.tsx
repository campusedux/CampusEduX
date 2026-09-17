import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

// Sitewide default OG image, used by any page that doesn't set its own
// openGraph.images (e.g. blog posts keep their featured image — a page-level
// metadata.openGraph.images always overrides this file-based default). Same
// brand mark as icon.tsx and the live header (Header.tsx): #4F39F6 tile with
// a white "C", plus the existing wordmark and tagline from lib/brand.ts.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7F8FD",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            height: 160,
            width: 160,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 36,
            background: "#4F39F6",
            color: "#fff",
            fontSize: 96,
            fontWeight: 900,
          }}
        >
          C
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 64,
            fontWeight: 800,
            color: "#111827",
          }}
        >
          Campus<span style={{ color: "#4F39F6" }}>EduX</span>
        </div>
        <div style={{ display: "flex", marginTop: 16, fontSize: 28, color: "#6B7280" }}>{BRAND.tagline}</div>
      </div>
    ),
    { ...size }
  );
}
