/**
 * Legal / compliance document identifiers. Each id maps to:
 *   - a content file  src/legal/content/<id>.json
 *   - a version entry LEGAL_VERSIONS[<id>]           (src/constants/legal.ts)
 *   - a public URL    LEGAL.urls[<id>]               (legal.config.json)
 *   - a route param   SettingsStackParamList.LegalDocument / AuthStackParamList
 *
 * Keep this list, legal.config.json and src/legal/content/ in sync — the test
 * tests/unit/legal/content.test.ts fails if they drift.
 */
export type LegalDocId =
  | "privacy-policy"
  | "terms"
  | "refund-policy"
  | "project-license"
  | "community-guidelines"
  | "disclaimer"
  | "data-and-permissions"
  | "contact"
  | "delete-account";

/** One heading + prose block inside a legal document. */
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

/** Shape of every file in src/legal/content/. Version + date are injected from
 *  LEGAL_VERSIONS at render time so the content files never carry a version. */
export interface LegalDocument {
  id: LegalDocId;
  title: string;
  /** One-line summary shown in the Legal & Privacy hub list. */
  summary: string;
  intro: string[];
  sections: LegalSection[];
}

export interface LegalDocumentVersion {
  version: string;
  effectiveDate: string;
}
