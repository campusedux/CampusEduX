import Link from "next/link";
import Image from "next/image";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image";

const BANNER_SRC = "/images/custom-project-banner.webp";

/**
 * "Custom Project Development" promo — shared by the Home page (above Quick
 * access) and the Projects page (top of the marketplace). One component, one
 * design, reused in both places rather than duplicated.
 *
 * The visual is a single source-of-truth artwork (`public/images/
 * custom-project-banner.webp`, shared with the mobile app's copy of the same
 * export) rendered at its exact aspect ratio — no HTML/CSS re-creation, no
 * cropping, no per-breakpoint redesign. The only interactive layer is two
 * transparent overlays positioned over the "Start Your Project" and "Get a
 * Free Consultation" buttons baked into the artwork, wired to the existing
 * custom-projects routes.
 *
 * Overlay positions are percentages measured directly from the source image
 * (2056×765) — because the wrapper is locked to that same aspect ratio, the
 * percentages stay pixel-accurate at every rendered width.
 */
const CTA = {
  start: { left: 4.33, top: 63.27, width: 17.25, height: 11.24 },
  learnMore: { left: 23.35, top: 63.27, width: 15.76, height: 11.24 },
} as const;

export function CustomProjectBanner() {
  return (
    <div className="relative w-full" style={{ aspectRatio: "2056 / 765" }}>
      <Image
        src={BANNER_SRC}
        alt="Custom Project Development — Have a project idea? We'll build it for you. Website, mobile app, web app, final year project, or custom software — share your idea and our team turns it into a complete, working project."
        fill
        placeholder="blur"
        blurDataURL={IMAGE_BLUR_DATA_URL}
        className="object-contain"
        sizes="100vw"
      />
      <Link
        href="/custom-projects/start"
        aria-label="Start your project"
        className="absolute rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        style={{
          left: `${CTA.start.left}%`,
          top: `${CTA.start.top}%`,
          width: `${CTA.start.width}%`,
          height: `${CTA.start.height}%`,
        }}
      />
      <Link
        href="/custom-projects"
        aria-label="Get a free consultation"
        className="absolute rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        style={{
          left: `${CTA.learnMore.left}%`,
          top: `${CTA.learnMore.top}%`,
          width: `${CTA.learnMore.width}%`,
          height: `${CTA.learnMore.height}%`,
        }}
      />
    </div>
  );
}

export default CustomProjectBanner;
