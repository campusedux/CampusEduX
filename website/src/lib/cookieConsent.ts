/** First-party website preferences. Advertising stays off until an ad CMP is integrated. */
export type CookieConsent = { analytics: boolean; ads: boolean };

export const COOKIE_CONSENT_NAME = "campusedux_consent_v1";
export const COOKIE_CONSENT_EVENT = "campusedux:cookie-consent";
export const COOKIE_SETTINGS_EVENT = "campusedux:cookie-settings";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function readCookieConsent(): CookieConsent | null {
  if (typeof document === "undefined") return null;
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${COOKIE_CONSENT_NAME}=`))
    ?.split("=")[1];
  if (!value || !/^a[01]d[01]$/.test(value)) return null;
  return { analytics: value[1] === "1", ads: value[3] === "1" };
}

export function saveCookieConsent(consent: CookieConsent): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_CONSENT_NAME}=a${Number(consent.analytics)}d${Number(consent.ads)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent<CookieConsent>(COOKIE_CONSENT_EVENT, { detail: consent }));
}

export function consentModeSignals(consent: CookieConsent) {
  const ad = consent.ads ? "granted" : "denied";
  return {
    analytics_storage: consent.analytics ? "granted" : "denied",
    ad_storage: ad,
    ad_user_data: ad,
    ad_personalization: ad,
  } as const;
}

/** Delete first-party GA cookies if analytics consent is withdrawn. */
export function clearAnalyticsCookies(): void {
  const host = window.location.hostname;
  const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const cookie of document.cookie.split("; ")) {
    const name = cookie.split("=")[0];
    if (!/^(_ga($|_)|_gid$|_gat($|_)|_gac_)/.test(name)) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ""}`;
    }
  }
}
