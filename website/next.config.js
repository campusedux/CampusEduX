/** @type {import('next').NextConfig} */

const contentRedirects = require("./src/lib/contentRedirects.json");
const { buildCsp } = require("./src/lib/csp");
// Always retain an enforced static fallback, including middleware-excluded assets.
// Next applies configured headers before middleware; nonce-mode middleware
// replaces this header for matched requests with its stricter request policy.
const csp = buildCsp({ isDev: process.env.NODE_ENV !== "production" });

const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
    // Serve AVIF first (≈20–30% smaller than WebP), WebP fallback. Every
    // catalog image goes through the /_next/image optimizer, so the browser
    // never receives a full-size Storage original.
    formats: ["image/avif", "image/webp"],
    // Catalog images change rarely and get a fresh URL on re-upload — let the
    // optimizer hold its resized output for a day instead of re-running hourly.
    minimumCacheTTL: 86400,
    // The widest image on the site is the ~800px project gallery / hero; drop
    // the 2048/3840 breakpoints the optimizer would otherwise pre-generate.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  // pdf-parse's pdfjs-dist dependency ships a Node/legacy build that
  // webpack's RSC bundling layer can't evaluate (crashes with
  // "Object.defineProperty called on non-object" at module load) —
  // excluding it from bundling lets Node's own require() load it directly
  // at runtime instead, which works correctly. @napi-rs/canvas is
  // pdf-parse's native optional dependency for the screenshot/table
  // features (unused here, but still resolved at import time).
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
  experimental: {
    // Barrel-file optimization: `@/components/ui` re-exports ~20 modules incl.
    // client ones (Modal, Drawer, FilterSheet, Reveal). This makes an import of
    // one symbol pull only that symbol's module, not evaluate the whole barrel.
    optimizePackageImports: ["@/components/ui"],
  },
  // Placement / Placement Prep / Placement Preparation are consolidated into the
  // single "Learning" system. Permanent (308) redirects preserve SEO equity.
  // `/placement/notes` + `/placement/notes/:id` keep their own route files
  // (the latter resolves a legacy prep_notes id to its Learning topic), so the
  // pattern below deliberately excludes `notes`.
  async redirects() {
    return [
      { source: "/placement", destination: "/learning", permanent: true },
      { source: "/placement/:path((?!notes$|notes/).*)", destination: "/learning", permanent: true },
      { source: "/placement-prep", destination: "/learning", permanent: true },
      { source: "/placement-preparation", destination: "/learning", permanent: true },
      // /projects/new, /projects/premium and /projects/best-sellers were
      // orphaned standalone landing pages with zero internal links and no
      // pagination — each duplicated a filter/sort the marketplace's own
      // `/projects` route already supports. Consolidated into that one route
      // (Phase 3 orphan-URL audit); best-sellers needs both `flag` and `sort`
      // since `flag=bestseller` alone defaults to newest-first, not sales rank.
      { source: "/projects/new", destination: "/projects", permanent: true },
      { source: "/projects/premium", destination: "/projects?flag=premium", permanent: true },
      { source: "/projects/best-sellers", destination: "/projects?flag=bestseller&sort=popular", permanent: true },
      // Phase 3 Batch 5: /practice/compiler rendered the exact same
      // CompilerWorkspace as /compiler (zero logic duplication) with weaker
      // metadata (no OpenGraph/Twitter, no WebApplication JSON-LD). /compiler
      // is the primary URL — it's the one linked from the drawer nav, footer,
      // Learning "Other Tutorials" block, and the hardcoded tutorial
      // "Run this code" hand-off (buildCompilerHref). Consolidated the same
      // direction, never the reverse.
      { source: "/practice/compiler", destination: "/compiler", permanent: true },
      // Duplicate lessons / problems merged into their stronger twin
      // (website/seo-report.md §d, owner-approved). Shared with the sitemap and
      // related-lesson code via src/lib/contentRedirects.ts. A literal 301, as
      // requested, rather than Next's default 308 for `permanent: true`.
      ...contentRedirects.map((r) => ({ source: r.source, destination: r.destination, statusCode: 301 })),
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
          // The site is HTTPS-only in production (Vercel). Pin browsers to
          // HTTPS for two years so a downgrade/SSL-strip MITM can't reach a
          // plaintext first hop. `includeSubDomains` covers api./www.; add
          // `; preload` once every subdomain is confirmed HTTPS. Ignored over
          // plain HTTP (`next start` / local dev), so it is safe to always send.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          // CSP `frame-ancestors 'none'` already blocks framing in modern
          // browsers; this is the legacy-browser backstop against clickjacking.
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

// Opt-in bundle analysis: `ANALYZE=true npm run build` writes treemap reports
// to .next/analyze/. A no-op for every normal build/deploy (enabled: false).
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer(nextConfig);
