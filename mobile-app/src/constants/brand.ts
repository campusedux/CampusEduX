/**
 * Single source of truth for user-facing brand strings. Import from here
 * instead of hard-coding the product name so a future rename is one edit.
 */
import { LEGAL } from "./legal";

export const BRAND = {
  name: "CampusEduX",
  tagline: "Learn. Build. Get Placed.",
  /** Read from legal.config.json — the single source of truth for contact addresses. */
  supportEmail: LEGAL.supportEmail,
  website: "https://www.campusedux.com",
  /**
   * Base URL used to build shareable referral links. Mirrors
   * website/src/app/account/referral/page.tsx:21 (`${SITE_URL}/register?ref=${code}`)
   * — the website has no `/ref/<code>` route, so append the code directly.
   */
  referralBaseUrl: "https://www.campusedux.com/register?ref=",
} as const;

export const APP_NAME = BRAND.name;
