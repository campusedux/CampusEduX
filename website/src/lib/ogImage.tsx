import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";
import { decodeEntities } from "@/lib/metaDescription";
import { BRAND_LOGO_HORIZONTAL } from "@/lib/brandLogoData";

/**
 * Shared renderer for the per-page Open Graph images (lesson, course, coding /
 * practice problem, blog post `opengraph-image.tsx` routes): the CampusEduX
 * horizontal logo (mark + wordmark, embedded from lib/brandLogoData.ts) on the
 * #F7F8FD canvas, with the page's own title and its course / section as the
 * eyebrow. Text comes only from the page's row;
 * when the row is missing the caller passes the brand tagline instead.
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// Rendered height of the logo in the card header (wordmark ≈ the old 40px text).
const LOGO_HEIGHT = 88;

function fit(text: string, max: number): string {
  const t = decodeEntities(String(text ?? "")).replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.–—-]+$/, "")}…`;
}

export function renderOgCard(input: { title: string; eyebrow?: string | null; footer?: string | null }): ImageResponse {
  const title = fit(input.title || BRAND.tagline, 110);
  const eyebrow = fit(input.eyebrow ?? "", 60);
  const footer = fit(input.footer ?? BRAND.tagline, 70);
  const titleSize = title.length <= 36 ? 76 : title.length <= 64 ? 62 : 50;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#F7F8FD",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- satori renders plain <img> only */}
          <img
            src={BRAND_LOGO_HORIZONTAL.src}
            width={Math.round((LOGO_HEIGHT * BRAND_LOGO_HORIZONTAL.width) / BRAND_LOGO_HORIZONTAL.height)}
            height={LOGO_HEIGHT}
            alt=""
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {eyebrow ? (
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: 700,
                color: "#4F39F6",
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              marginTop: eyebrow ? 20 : 0,
              fontSize: titleSize,
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#111827",
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 26, color: "#6B7280" }}>{footer}</div>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 600, color: "#6B7280" }}>campusedux.com</div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
