/**
 * Single source of truth for user-facing brand strings on the website — the
 * counterpart of `mobile-app/src/constants/brand.ts`. Import from here instead
 * of hard-coding the product name.
 *
 * The product is "CampusEduX" everywhere (app, admin panel, website). The old
 * "ProjectHub" name is retired — do not reintroduce it.
 */
export const BRAND = {
  name: "CampusEduX",
  tagline: "Learn. Build. Get Placed.",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@campusedux.app",
  website: "https://www.campusedux.com",
} as const;
