// Centralizes the GA4 measurement id so it's read from the environment in
// exactly one place. Unset in an environment (e.g. local dev without the var)
// -> analytics stays off everywhere that imports this, with no error thrown.
import { readCookieConsent } from "@/lib/cookieConsent";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function sendPageview(url: string) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || typeof window.gtag !== "function" || !readCookieConsent()?.analytics) {
    return;
  }
  window.gtag("config", GA_MEASUREMENT_ID, { page_path: url });
}
