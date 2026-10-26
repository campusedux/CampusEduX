import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Bricolage_Grotesque } from "next/font/google";
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

// Self-hosted at build time by next/font (served from our own origin, so the
// CSP's `font-src 'self'` still holds). Plus Jakarta Sans = UI/body,
// Bricolage Grotesque = display headings. Both are variable fonts.
const fontSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const fontDisplay = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: THEME_INIT_SCRIPT adds `dark` to <html> before
    // React hydrates, which is expected and must not warn.
    <html lang="en" className={`${fontSans.variable} ${fontDisplay.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {supabaseOrigin && <link rel="dns-prefetch" href={supabaseOrigin} />}
        <link rel="dns-prefetch" href="https://checkout.razorpay.com" />
      </head>
      <body className="bg-canvas font-sans text-ink antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd()} />
        <GoogleAnalytics />
        <Header />
        <AnnouncementBar />
        <main id="main-content" className="min-h-[60vh]">
          {children}
        </main>
        <Footer />
        {/* Clears the fixed mobile bottom nav. */}
        <div className="h-[calc(4rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden />
        <BottomNav />
        <CookieConsentBanner />
        <Toaster />
      </body>
    </html>
  );
}
