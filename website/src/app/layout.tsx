import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${BRAND.name} — Projects, Jobs, Placement Prep & Resume, in one app`,
    template: `%s | ${BRAND.name}`,
  },
  description:
    "CampusEduX is a student platform for the project marketplace, jobs & internships, placement preparation, resume building and custom project development.",
  applicationName: BRAND.name,
  openGraph: {
    type: "website",
    siteName: BRAND.name,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white font-sans text-ink antialiased">
        <JsonLd data={organizationJsonLd} />
        <NavBar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
