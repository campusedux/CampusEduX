import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo";
import type { LegalDocId } from "./types";
import { fillTokens } from "./interpolate";
import { getLegalDocument, legalPath } from "./registry";

/**
 * Build page `Metadata` for a legal route: title from the document, description
 * from its (token-filled) summary, a canonical URL, and normal indexing —
 * public policy pages should be crawlable.
 */
export function legalMetadata(docId: LegalDocId): Metadata {
  const doc = getLegalDocument(docId);
  const path = legalPath(docId);
  const description = fillTokens(doc.summary);
  return {
    title: doc.title,
    description,
    alternates: { canonical: path },
    openGraph: { title: doc.title, description, url: absoluteUrl(path), type: "article" },
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
    alternates: { canonical: opts.path },
    openGraph: { title: opts.title, description: opts.description, url: absoluteUrl(opts.path), type: "article" },
    robots: { index: true, follow: true },
  };
}
