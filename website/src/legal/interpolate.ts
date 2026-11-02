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
  customProjectTokenPrices: "shown for your selected project type and level in the estimate before payment; contact us if pricing is unavailable",
};

export function fillTokens(text: string, overrides: Record<string, string> = {}): string {
  const tokens = { ...TOKENS, ...overrides };
  return text.replace(/\{\{(\w+)\}\}/g, (whole, key: string) =>
    key in tokens ? String(tokens[key]) : whole,
  );
}

/** Returns a copy with canonical and website-only tokens resolved. */
export function interpolateDocument(doc: LegalDocument, overrides: Record<string, string> = {}): LegalDocument {
  const fill = (text: string) => fillTokens(text, overrides);
  const list = (items?: string[]) => items?.map(fill);
  const subsection = (s: LegalSubsection): LegalSubsection => ({
    heading: fill(s.heading), body: list(s.body), bullets: list(s.bullets),
  });
  const section = (s: LegalSection): LegalSection => ({
    heading: fill(s.heading), body: list(s.body), bullets: list(s.bullets),
    subsections: s.subsections?.map(subsection),
  });
  return { ...doc, title: fill(doc.title), summary: fill(doc.summary),
    intro: doc.intro.map(fill), sections: doc.sections.map(section) };
}
