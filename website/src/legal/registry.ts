/**
 * Registry that ties each legal document to its content, version, website path
 * and place in the `/legal` hub. Route files under `src/app/` import from here
 * so titles, summaries, versions and cross-links stay in one place.
 */
import type { LegalDocId, LegalDocument } from "./types";
import { LEGAL_VERSIONS } from "./config";
import { websiteDocument } from "./website";

import privacyPolicy from "./content/privacy-policy.json";
import terms from "./content/terms.json";
import refundPolicy from "./content/refund-policy.json";
import projectLicense from "./content/project-license.json";
import communityGuidelines from "./content/community-guidelines.json";
import disclaimer from "./content/disclaimer.json";
import dataAndPermissions from "./content/data-and-permissions.json";
import contact from "./content/contact.json";
import deleteAccount from "./content/delete-account.json";
import cookiePolicy from "./content/cookie-policy.json";

export const LEGAL_DOCUMENTS: Record<LegalDocId, LegalDocument> = {
  "privacy-policy": websiteDocument(privacyPolicy as LegalDocument),
  terms: websiteDocument(terms as LegalDocument),
  "refund-policy": websiteDocument(refundPolicy as LegalDocument),
  "project-license": projectLicense as LegalDocument,
  "community-guidelines": communityGuidelines as LegalDocument,
  disclaimer: disclaimer as LegalDocument,
  "data-and-permissions": dataAndPermissions as LegalDocument,
  contact: contact as LegalDocument,
  "delete-account": deleteAccount as LegalDocument,
  "cookie-policy": cookiePolicy as LegalDocument,
};

export function getLegalDocument(id: LegalDocId): LegalDocument {
  return LEGAL_DOCUMENTS[id];
}

/** How a hub entry is presented on the website. */
type HubKind =
  | "doc" // rendered straight from a content JSON
  | "composed" // a hand-built page that reads config values (grievance)
  | "form"; // the content JSON plus an interactive element (contact form)

export interface LegalHubEntry {
  id: LegalDocId | "grievance";
  title: string;
  summary: string;
  /** Website path, e.g. "/privacy-policy". */
  path: string;
  version: string;
  effectiveDate: string;
  kind: HubKind;
}

const PATHS: Record<LegalDocId, string> = {
  "privacy-policy": "/privacy-policy",
  terms: "/terms",
  "refund-policy": "/refund-policy",
  "project-license": "/project-license",
  "community-guidelines": "/community-guidelines",
  disclaimer: "/disclaimer",
  "data-and-permissions": "/data-and-permissions",
  "cookie-policy": "/cookie-policy",
  contact: "/contact",
  "delete-account": "/delete-account",
};

export function legalPath(id: LegalDocId | "grievance"): string {
  return id === "grievance" ? "/grievance" : PATHS[id];
}

function entry(id: LegalDocId, kind: HubKind): LegalHubEntry {
  const doc = LEGAL_DOCUMENTS[id];
  return {
    id,
    title: doc.title,
    summary: doc.summary,
    path: PATHS[id],
    version: LEGAL_VERSIONS[id].version,
    effectiveDate: LEGAL_VERSIONS[id].effectiveDate,
    kind,
  };
}

/** Ordered list shown on `/legal` and in the site footer. Mirrors the mobile
 *  app's Legal & Privacy hub, with the two website-only pages slotted in. */
export const LEGAL_INDEX: LegalHubEntry[] = [
  entry("privacy-policy", "doc"),
  entry("terms", "doc"),
  entry("refund-policy", "doc"),
  entry("project-license", "doc"),
  entry("community-guidelines", "doc"),
  entry("disclaimer", "doc"),
  entry("data-and-permissions", "doc"),
  entry("cookie-policy", "doc"),
  {
    id: "grievance",
    title: "Grievance Redressal",
    summary: "How to raise a grievance and reach the Grievance Officer.",
    path: "/grievance",
    version: LEGAL_VERSIONS.grievance.version,
    effectiveDate: LEGAL_VERSIONS.grievance.effectiveDate,
    kind: "composed",
  },
  entry("delete-account", "doc"),
  entry("contact", "form"),
];

/** Related-policy chips shown under each document. */
export const RELATED: Record<LegalDocId | "grievance", (LegalDocId | "grievance")[]> = {
  "privacy-policy": ["data-and-permissions", "cookie-policy", "delete-account", "grievance"],
  terms: ["privacy-policy", "refund-policy", "project-license", "disclaimer"],
  "refund-policy": ["terms", "project-license", "contact"],
  "project-license": ["terms", "community-guidelines"],
  "community-guidelines": ["terms", "disclaimer"],
  disclaimer: ["terms", "project-license"],
  "data-and-permissions": ["privacy-policy", "cookie-policy", "delete-account"],
  "cookie-policy": ["privacy-policy", "data-and-permissions"],
  "delete-account": ["privacy-policy", "data-and-permissions", "contact"],
  contact: ["privacy-policy", "grievance", "delete-account"],
  grievance: ["privacy-policy", "contact", "terms"],
};
