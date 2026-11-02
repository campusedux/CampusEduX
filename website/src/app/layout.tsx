
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/nav/Header";
import { BottomNav } from "@/components/nav/BottomNav";
import { AnnouncementBar } from "@/components/home/AnnouncementBar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import CookieConsentBanner from "@/components/analytics/CookieConsent";
import { BRAND } from "@/lib/brand";
import { BRAND_LOGO_URL, DEFAULT_OG_IMAGE, SITE_URL, websiteJsonLd } from "@/lib/seo";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { Toaster } from "@/components/ui/Toast";
import { headers } from "next/headers";
import { ScriptNonceProvider } from "@/components/analytics/ScriptNonce";

// System font stacks are defined in globals.css. Builds and first renders do
// not require Google Fonts network access or an unverified cached font bundle.

const siteUrl = SITE_URL;

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BRAND.name,
  url: siteUrl,
  logo: BRAND_LOGO_URL,
};

const description =
  "CampusEduX is a student platform for the project marketplace, jobs & internships, placement preparation, resume building and custom project development.";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F7FC" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0C16" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${BRAND.name} — Projects, Jobs, Placement Prep & Resume, in one app`,
    template: `%s | ${BRAND.name}`,
  },
  description,
  applicationName: BRAND.name,
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    url: siteUrl,
    description,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: `${BRAND.name} logo` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — for students, from sign-up to placement`,
    description,
  },
  // Google AdSense site verification
  other: {
    "google-adsense-account": "ca-pub-2198114551995689",
  },
};

// Origin of the Supabase project. A signed-out first page load no longer
// contacts it from the browser at all — the session check and announcements go
// through same-origin `/api/*` routes, catalog images through `/_next/image`,
// and the browser SDK is imported lazily only for signed-in flows. So a full
// `preconnect` (TCP + TLS during the critical load window, reported by
// Lighthouse as unused) is replaced by a cheap `dns-prefetch`, the same as
// Razorpay, which only loads on a checkout click.
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return null;
  }
})();

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Nonces require dynamic HTML. Only opt in when advertising is enabled.
  const nonce: string | undefined = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true"
    ? (await headers()).get("x-nonce") ?? undefined
    : undefined;

  return (
    // suppressHydrationWarning: THEME_INIT_SCRIPT adds `dark` to <html> before
    // React hydrates, which is expected and must not warn.
    <html lang="en" suppressHydrationWarning>
      <head>
        {nonce && <meta name="csp-nonce" content={nonce} />}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {supabaseOrigin && <link rel="dns-prefetch" href={supabaseOrigin} />}
        <link rel="dns-prefetch" href="https://checkout.razorpay.com" />
      </head>
      <body className="bg-canvas font-sans text-ink antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--z-modal)] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <ScriptNonceProvider nonce={nonce}>
          <JsonLd data={organizationJsonLd} />
          <JsonLd data={websiteJsonLd()} />
          <GoogleAnalytics />
          <Header />
          <AnnouncementBar />
          <main id="main-content" className="mobile-scroll-content min-h-[60vh]">
            {children}
          </main>
          <Footer />
          <BottomNav />
          <CookieConsentBanner />
          <Toaster />
        </ScriptNonceProvider>
      </body>
    </html>
  );
}
