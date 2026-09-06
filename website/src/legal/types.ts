/**
 * Shapes for the canonical legal content. Mirrors
 * `mobile-app/src/types/legal.types.ts` so the JSON files in
 * `src/legal/content/` deserialize identically on web and in the app.
 *
 * `SharedLegalDocId` — the 9 documents synced verbatim from the mobile app
 * (see `scripts/sync-legal.mjs`). `WebOnlyLegalDocId` — documents that only make
 * sense on the website (the app has no cookies).
 */

export type SharedLegalDocId =
  | "privacy-policy"
  | "terms"
  | "refund-policy"
  | "project-license"
  | "community-guidelines"
  | "disclaimer"
  | "data-and-permissions"
  | "contact"
  | "delete-account";

export type WebOnlyLegalDocId = "cookie-policy";

/** Every document that has a content JSON file + a page on the website. */
export type LegalDocId = SharedLegalDocId | WebOnlyLegalDocId;

export interface LegalSubsection {
  heading: string;
  body?: string[];
  bullets?: string[];
}

export interface LegalSection {
  heading: string;
  body?: string[];
  bullets?: string[];
  subsections?: LegalSubsection[];
}

/** Shape of every file in `src/legal/content/`. Version + effective date are NOT
 *  stored in the file — they come from `legal.config.json` via `registry.ts`. */
export interface LegalDocument {
  id: LegalDocId;
  title: string;
  summary: string;
  intro: string[];
  sections: LegalSection[];
}

export interface LegalDocumentVersion {
  version: string;
  effectiveDate: string;
}
