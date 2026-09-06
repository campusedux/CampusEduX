/**
 * Fills {{token}} placeholders in legal content from `legal.config.json`
 * (via `config.ts`). Dependency-free — mirrors
 * `mobile-app/src/legal/interpolate.ts` so tokens resolve identically on web
 * and in the app.
 */
import { LEGAL, LEGAL_RULES } from "./config";
import type { LegalDocument, LegalSection, LegalSubsection } from "./types";

const TOKENS: Record<string, string | number> = {
  appName: LEGAL.appName,
  companyName: LEGAL.companyName,
  entityDescription: LEGAL.entityDescription,
  country: LEGAL.country,
  governingCityState: LEGAL.governingCityState,
  registeredAddress: LEGAL.registeredAddress,
  grievanceOfficerName: LEGAL.grievanceOfficerName,
  website: LEGAL.website,
  supportEmail: LEGAL.supportEmail,
  legalEmail: LEGAL.legalEmail,
  privacyEmail: LEGAL.privacyEmail,
  grievanceEmail: LEGAL.grievanceEmail,
  paymentProcessorName: LEGAL.paymentProcessorName,
  paymentProcessorPrivacyUrl: LEGAL.paymentProcessorPrivacyUrl,
  infraProviderName: LEGAL.infraProviderName,
  infraProviderPrivacyUrl: LEGAL.infraProviderPrivacyUrl,
  minimumAge: LEGAL.minimumAge,
  effectiveDate: LEGAL.effectiveDate,
  supportResponseBusinessDays: LEGAL.supportResponseBusinessDays,
  refundRequestWindowDays: LEGAL_RULES.refundRequestWindowDays,
  refundProcessingBusinessDays: LEGAL_RULES.refundProcessingBusinessDays,
  premiumRefundableWithinDaysIfUnused: LEGAL_RULES.premiumRefundableWithinDaysIfUnused,
  withdrawalProcessingBusinessDays: LEGAL_RULES.withdrawalProcessingBusinessDays,
};

export function fillTokens(text: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (whole, key: string) =>
    key in TOKENS ? String(TOKENS[key]) : whole,
  );
}

const fillList = (items?: string[]) => items?.map(fillTokens);

function fillSubsection(s: LegalSubsection): LegalSubsection {
  return { heading: fillTokens(s.heading), body: fillList(s.body), bullets: fillList(s.bullets) };
}

function fillSection(s: LegalSection): LegalSection {
  return {
    heading: fillTokens(s.heading),
    body: fillList(s.body),
    bullets: fillList(s.bullets),
    subsections: s.subsections?.map(fillSubsection),
  };
}

/** Returns a copy of the document with every placeholder resolved. */
export function interpolateDocument(doc: LegalDocument): LegalDocument {
  return {
    ...doc,
    title: fillTokens(doc.title),
    summary: fillTokens(doc.summary),
    intro: doc.intro.map(fillTokens),
    sections: doc.sections.map(fillSection),
  };
}
