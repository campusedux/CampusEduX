import type { Metadata } from "next";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/seo";
import type { LegalDocId } from "./types";
import { fillTokens } from "./interpolate";
import { getLegalDocument, legalPath } from "./registry";

const SEO_COPY: Partial<Record<LegalDocId, { title: string; description: string }>> = {
  "privacy-policy": { title: "CampusEduX Privacy Policy", description: "See what data CampusEduX collects, how it uses and stores it, which providers help us, and how to exercise your privacy rights." },
  terms: { title: "CampusEduX Terms & Conditions", description: "Read the terms for accounts, projects, jobs, Premium, payments, licensing and use of CampusEduX services." },
  "refund-policy": { title: "CampusEduX Refund & Cancellation Policy", description: "Learn when project, Premium, wallet and custom-project purchases may be cancelled or refunded and how to request help." },
  "cookie-policy": { title: "CampusEduX Cookie Policy", description: "Learn how CampusEduX uses sign-in, functional and analytics cookies, and how to manage your browser choices." },
  disclaimer: { title: "CampusEduX Disclaimer", description: "Read the limits of CampusEduX learning, projects, jobs, resume tools and placement preparation advice." },
  "community-guidelines": { title: "CampusEduX Community Guidelines", description: "Review standards for reviews, uploads, referrals and respectful use of CampusEduX, plus how to report concerns." },
  "data-and-permissions": { title: "CampusEduX Data & Permissions", description: "See the account data CampusEduX stores and which device permissions its website and mobile app use." },
};

/**
 * Build page `Metadata` for a legal route: title from the document, description
 * from its (token-filled) summary, a canonical URL, and normal indexing —
 * public policy pages should be crawlable.
 */
export function legalMetadata(docId: LegalDocId): Metadata {
  const doc = getLegalDocument(docId);
  const path = legalPath(docId);
  const title = SEO_COPY[docId]?.title ?? doc.title;
  const description = SEO_COPY[docId]?.description ?? fillTokens(doc.summary);
  return {
    title: SEO_COPY[docId] ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: absoluteUrl(path), type: "article", images: [DEFAULT_OG_IMAGE] },
    robots: { index: true, follow: true },
  };
}

/** Same, for a hand-composed legal page (no content JSON). */
export function composedLegalMetadata(opts: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: absoluteUrl(opts.path) },
    openGraph: { title: opts.title, description: opts.description, url: absoluteUrl(opts.path), type: "article", images: [DEFAULT_OG_IMAGE] },
    robots: { index: true, follow: true },
  };
}
