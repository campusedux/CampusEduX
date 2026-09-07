/** @type {import('next').NextConfig} */

// Deliberately permissive enough for what this app actually loads: the
// Supabase project (REST + Edge Functions + Storage) and Razorpay's checkout
// script/iframe (wallet top-up + Premium). Fonts are self-hosted by
// next/font, so no external font host is needed. Nothing else.
//
// `next dev` (Fast Refresh / HMR / webpack eval source-maps) evaluates code
// with eval(), so 'unsafe-eval' is required in development only. A production
// build never needs it, so it stays out of the deployed policy.
const isDev = process.env.NODE_ENV !== "production";
const scriptSrc = [
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
  isDev ? "'unsafe-eval'" : "",
]
  .filter(Boolean)
  .join(" ");

const csp = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com",
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "frame-ancestors 'none'",
  // Nothing on the site uses <object>/<embed>/<applet>, and there is no
  // <base> tag — lock both down so an injected one can't repoint relative
  // URLs or load a plugin. `form-action` keeps a submitted <form> pointed at
  // our own origin (Razorpay is an iframe/redirect flow, not a cross-origin
  // form POST from our pages).
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

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
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
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
      {
        // `/projects` and `/jobs` are dynamically rendered (they read
        // `searchParams`), but their data is served from a per-filter
        // cross-request cache (src/lib/cache.ts) and the HTML is identical for
        // every visitor with the same query string. Let a CDN/edge hold the
        // full response briefly, keyed by URL. Hosts that respect this (Vercel)
        // turn these into edge hits; `next start` still sends its own
        // `no-store` and ignores this — that's expected.
        source: "/:path(projects|jobs)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
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
