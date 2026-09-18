/**
 * Single source of truth for legal / compliance configuration on the website.
 *
 * `legal.config.json` is copied verbatim from `mobile-app/src/legal/` by
 * `scripts/sync-legal.mjs` — the mobile app owns it. To change an owner fact
 * (address, grievance officer, jurisdiction) or a business rule (refund window,
 * etc.) edit it there, bump the relevant version, then run `npm run legal:sync`.
 * `src/legal/__tests__/legal-consistency.test.ts` fails if the copies drift.
 *
 * Owner-input placeholders (`[GOVERNING CITY, STATE]`, `[REGISTERED BUSINESS
 * ADDRESS]`, `[GRIEVANCE OFFICER NAME]`) are intentionally left bracketed so
 * they are obvious wherever they render, on the website and in the app, until
 * the owner supplies real values. Never fabricate them.
 */
import raw from "./legal.config.json";
import type { LegalDocId, LegalDocumentVersion, SharedLegalDocId } from "./types";

type RawConfig = typeof raw;

export const LEGAL = raw as RawConfig;

/** Configurable business rules referenced by the policy copy. */
export const LEGAL_RULES = raw.rules;

/** Bumped whenever any individual policy version changes; recorded at consent. */
export const CURRENT_LEGAL_VERSION = raw.currentLegalVersion;

/** Website-only documents/pages that are not part of the mobile canonical set. */
const WEB_ONLY_VERSIONS: Record<"cookie-policy" | "grievance", LegalDocumentVersion> = {
  "cookie-policy": { version: "1.1.0", effectiveDate: "2026-09-18" },
  grievance: { version: "1.0.0", effectiveDate: "2026-08-31" },
};

/** Per-document `{ version, effectiveDate }` — shared docs from the synced
 *  config, website-only docs from the table above. */
export const LEGAL_VERSIONS: Record<LegalDocId | "grievance", LegalDocumentVersion> = {
  ...(raw.versions as Record<SharedLegalDocId, LegalDocumentVersion>),
  ...WEB_ONLY_VERSIONS,
};

/** "2026-08-31" -> "31 August 2026" (UTC, stable across server/client). */
export function formatLegalDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
