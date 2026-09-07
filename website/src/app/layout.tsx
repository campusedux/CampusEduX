import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/nav/Header";
import { BottomNav } from "@/components/nav/BottomNav";
import { AnnouncementBar } from "@/components/home/AnnouncementBar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";

// The mobile app loads no custom font — it renders in the platform system
// font. The website matches that with a system sans stack defined in
// tailwind.config.ts / globals.css, so there is no external font request and
// nothing to add to the CSP.

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? BRAND.website;

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BRAND.name,
  url: siteUrl,
};

const description =
  "CampusEduX is a student platform for the project marketplace, jobs & internships, placement preparation, resume building and custom project development.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${BRAND.name} — Projects, Jobs, Placement Prep & Resume, in one app`,
    template: `%s | ${BRAND.name}`,
  },
  description,
  applicationName: BRAND.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    url: siteUrl,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — for students, from sign-up to placement`,
    description,
  },
};

// Origin of the Supabase project — the browser opens a connection to it on
// every page (client session check, announcements, storage image hosts). Warm
// the DNS + TLS handshake in <head> so the first client Supabase call isn't
// paying for it. Razorpay only loads on a checkout click, so a cheap
// dns-prefetch (no handshake cost) is enough there.
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return null;
  }
})();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {supabaseOrigin && (
          <>
            <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        )}
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
        <Header />
        <AnnouncementBar />
        <main id="main-content" className="min-h-[60vh]">
          {children}
        </main>
        <Footer />
        {/* Clears the fixed mobile bottom nav. */}
        <div className="h-16 md:hidden" aria-hidden />
        <BottomNav />
      </body>
    </html>
  );
}
