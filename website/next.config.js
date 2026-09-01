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
].join("; ");

const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
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
        ],
      },
    ];
  },
};
module.exports = nextConfig;
