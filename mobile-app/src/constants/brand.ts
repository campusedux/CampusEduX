/**
 * Single source of truth for user-facing brand strings. Import from here
 * instead of hard-coding the product name so a future rename is one edit.
 */
export const BRAND = {
  name: "CampusEduX",
  tagline: "Learn. Build. Get Placed.",
  supportEmail: "support@campusedux.app",
  website: "https://www.campusedux.com",
  /** Base URL used to build shareable referral links. */
  referralBaseUrl: "https://www.campusedux.com/ref",
} as const;

export const APP_NAME = BRAND.name;
