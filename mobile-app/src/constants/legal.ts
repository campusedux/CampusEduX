/**
 * Single source of truth for legal / compliance configuration.
 *
 * Business-owner-configurable values (company name, contact addresses, refund
 * rules, jurisdiction) and per-document versions all live in
 * src/legal/legal.config.json so the same file can be consumed by:
 *   - the mobile app (this module)
 *   - the static website generator (scripts/generate-legal-html.mjs)
 *
 * Update legal.config.json when a policy changes: bump the relevant
 * `versions.<id>.version` + `effectiveDate`, and `currentLegalVersion`.
 * The consent record written at first sign-in (services/legal.service.ts)
 * captures whichever versions the app displayed.
 */
import raw from "@/legal/legal.config.json";
import type { LegalDocId, LegalDocumentVersion } from "@/types";

type RawConfig = typeof raw;

export const LEGAL = raw as RawConfig;

/** Per-document `{ version, effectiveDate }`. */
export const LEGAL_VERSIONS: Record<LegalDocId, LegalDocumentVersion> =
  raw.versions as Record<LegalDocId, LegalDocumentVersion>;

/** Bumped whenever any individual policy version changes. Recorded at consent. */
export const CURRENT_LEGAL_VERSION = raw.currentLegalVersion;

/** Public website URL for a policy (used by the "Open on website" action). */
export function legalUrl(id: LegalDocId): string {
  return raw.urls[id];
}

/** Configurable business rules referenced by the policy copy. */
export const LEGAL_RULES = raw.rules;

/** Ordered list for the in-app "Legal & Privacy" hub. */
export const LEGAL_HUB_ORDER: LegalDocId[] = [
  "privacy-policy",
  "terms",
  "refund-policy",
  "project-license",
  "community-guidelines",
  "disclaimer",
  "data-and-permissions",
  "delete-account",
  "contact",
];
