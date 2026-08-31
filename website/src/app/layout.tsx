import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";

// Self-hosted by next/font (no render-blocking external stylesheet, and no
// third-party font request to allow in the CSP). The CSS variables match the
// names tailwind.config.ts already maps `font-serif` / `font-sans` to.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://campusedux.app";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CampusEduX",
  alternateName: "ProjectHub",
  url: siteUrl,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CampusEduX — Projects, Jobs, Placement Prep & Resume, in one app",
    template: "%s | CampusEduX",
  },
  description:
    "CampusEduX (ProjectHub) is a student platform for the project marketplace, jobs & internships, placement preparation, resume building and custom project development.",
  openGraph: {
    type: "website",
    siteName: "CampusEduX",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${ibmPlexSans.variable}`}>
      <body className="font-sans antialiased">
        <JsonLd data={organizationJsonLd} />
        <NavBar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
