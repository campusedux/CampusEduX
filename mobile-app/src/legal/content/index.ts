/**
 * Canonical legal document content. Each entry is authored as a plain JSON file
 * in this folder so the exact same source can be consumed by:
 *   - the mobile app (this registry -> LegalDocumentBody)
 *   - the static website generator (scripts/generate-legal-html.mjs)
 *
 * Version + effective date are NOT stored here — they come from
 * LEGAL_VERSIONS (src/constants/legal.ts) so there is one place to bump them.
 *
 * {{token}} placeholders in the text are filled from LEGAL / LEGAL_RULES by
 * src/legal/interpolate.ts.
 */
import type { LegalDocId, LegalDocument } from "@/types";

import privacyPolicy from "./privacy-policy.json";
import terms from "./terms.json";
import refundPolicy from "./refund-policy.json";
import projectLicense from "./project-license.json";
import communityGuidelines from "./community-guidelines.json";
import disclaimer from "./disclaimer.json";
import dataAndPermissions from "./data-and-permissions.json";
import contact from "./contact.json";
import deleteAccount from "./delete-account.json";

export const LEGAL_DOCUMENTS: Record<LegalDocId, LegalDocument> = {
  "privacy-policy": privacyPolicy as LegalDocument,
  terms: terms as LegalDocument,
  "refund-policy": refundPolicy as LegalDocument,
  "project-license": projectLicense as LegalDocument,
  "community-guidelines": communityGuidelines as LegalDocument,
  disclaimer: disclaimer as LegalDocument,
  "data-and-permissions": dataAndPermissions as LegalDocument,
  contact: contact as LegalDocument,
  "delete-account": deleteAccount as LegalDocument,
};

export function getLegalDocument(id: LegalDocId): LegalDocument {
  return LEGAL_DOCUMENTS[id];
}
