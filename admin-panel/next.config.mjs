/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // ADM-07: baseline security headers. The CSP is deliberately conservative — no
  // script-src/style-src (Next.js inlines bootstrap scripts + Tailwind styles) — but
  // it blocks framing (clickjacking), plugin content, <base> hijacking and
  // cross-origin form posts.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Staff tooling has no public search landing pages, including login.
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
          },
          // HTTPS-only in production; ignored over plain HTTP (local dev).
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          // Legacy-browser backstop for frame-ancestors.
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
