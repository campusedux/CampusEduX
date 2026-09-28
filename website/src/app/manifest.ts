import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

// Web app manifest (served at /manifest.webmanifest; Next adds the <link>).
// Icons are generated from the master logo by scripts/generate-logos.mjs.
// theme_color is the navy of the CampusEduX wordmark.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.name,
    description: "Projects, jobs, placement prep and resumes for students.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#000D3E",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
