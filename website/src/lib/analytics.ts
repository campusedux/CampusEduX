import { COOKIE_CONSENT_EVENT, readCookieConsent } from "@/lib/cookieConsent";
import { documentScriptNonce } from "@/components/analytics/ScriptNonce";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type AnalyticsPage = {
  page_path: string;
  page_location: string;
  page_referrer: string;
};

// Drop every query/fragment, including unknown and nested credential names.
// Auth endpoints and the token-bearing public resume share URL are excluded.
const PRIVATE_ROUTE = /^\/(?:auth|api|account|login|register|forgot-password|reset-password|verify-email|email-verified|onboarding|r)(?:\/|$)/i;

export function sanitizeAnalyticsUrl(value: string, origin: string): string | null {
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin || url.username || url.password || !/^https?:$/.test(url.protocol)) return null;
    const path = decodeURIComponent(url.pathname);
    if (PRIVATE_ROUTE.test(path) || /[%?#\\\s=]/.test(path)) return null;
    return url.pathname;
  } catch {
    return null;
  }
}

export function analyticsPage(value: string, origin: string, referrer = ""): AnalyticsPage | null {
  const path = sanitizeAnalyticsUrl(value, origin);
  if (path === null) return null;
  let safeReferrer = "";
  if (referrer) {
    try {
      const ref = new URL(referrer, origin);
      if (/^https?:$/.test(ref.protocol) && !ref.username && !ref.password) {
        const refPath = sanitizeAnalyticsUrl(ref.href, origin);
        safeReferrer = ref.origin === origin ? (refPath === null ? "" : `${origin}${refPath}`) : `${ref.origin}/`;
      }
    } catch { /* Invalid referrers are omitted. */ }
  }
  return { page_path: path, page_location: `${origin}${path}`, page_referrer: safeReferrer };
}

let script: HTMLScriptElement | null = null;
let loaded = false;
let configured = false;
let defaultsSet = false;
let pending: AnalyticsPage[] = [];
let previous = "";
let users = 0;
let enabled = false;
let storageGranted = false;
const DENIED = { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };

function setEnabled(next: boolean) {
  // Collection is disabled on private routes and cleanup. On public routes,
  // Consent Mode gates cookies while denied storage permits cookieless pings.
  Object.assign(window, { [`ga-disable-${GA_MEASUREMENT_ID}`]: !next });
  const granted = next && readCookieConsent()?.analytics === true;
  if (storageGranted !== granted) {
    window.gtag?.("consent", "update", { ...DENIED, analytics_storage: granted ? "granted" : "denied" });
    storageGranted = granted;
  }
  enabled = next;
}

function pause() {
  setEnabled(false);
  pending = [];
  previous = "";
}

function deliver() {
  if (!loaded || !users || !enabled) return;
  if (!analyticsPage(window.location.href, window.location.origin)) {
    pause();
    return;
  }
  // Configure only once the loader is ready, using the latest consent. This
  // avoids configuring granted storage after consent was withdrawn in flight.
  if (!configured) {
    configured = true;
    const page = analyticsPage(window.location.href, window.location.origin)!;
    window.gtag?.("set", { ...page, page_title: "CampusEduX" });
    window.gtag?.("js", new Date());
    window.gtag?.("config", GA_MEASUREMENT_ID, {
      ...page, page_title: "CampusEduX", send_page_view: false,
      allow_google_signals: false, allow_ad_personalization_signals: false,
    });
  }
  for (const page of pending.splice(0)) {
    const fields = { ...page, page_title: "CampusEduX" };
    window.gtag?.("set", fields);
    window.gtag?.("event", "page_view", { ...fields, send_to: GA_MEASUREMENT_ID });
  }
}

export function sendPageview(value: string) {
  if (!users || !GA_MEASUREMENT_ID || typeof window === "undefined") return;
  const origin = window.location.origin;
  // A caller cannot disguise an auth page by supplying a public path.
  // Never alter history or consume authentication credentials.
  const current = analyticsPage(window.location.href, origin);
  const page = analyticsPage(value, origin, previous || document.referrer);
  if (!current || !page || current.page_path !== page.page_path) {
    pause();
    return;
  }
  // Google requires a document with HTTP(S) and cookie access. An opaque
  // sandbox/srcdoc document throws inside Google's cookie reader before send.
  if (!/^https?:$/.test(window.location.protocol)) return;
  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer!.push(arguments); };
  }
  if (!defaultsSet) {
    window.gtag("consent", "default", DENIED);
    defaultsSet = true;
  }
  setEnabled(true);
  // Queries, hashes and unchanged consent saves are not new logical pages.
  if (previous === page.page_location) return;
  pending.push(page);
  previous = page.page_location;
  // This app owns page views. Disable the stream's Enhanced Measurement
  // "Page changes based on browser history events" to avoid remote duplicates.
  if (!script) {
    const next = document.createElement("script");
    next.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    next.async = true;
    next.referrerPolicy = "no-referrer";
    const nonce = documentScriptNonce();
    if (nonce) next.nonce = nonce;
    next.onload = () => {
      if (script !== next) return;
      loaded = true;
      deliver();
    };
    next.onerror = () => {
      if (script !== next) return;
      next.remove();
      script = null;
      loaded = false;
      // Fail closed, without throwing or retrying in a background loop. A
      // subsequent consent action/navigation can retry the current public page.
      pause();
    };
    script = next;
    document.head.appendChild(next);
  }
  deliver();
}

export function initializeAnalytics(): () => void {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID || !/^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID)) return () => {};
  if (users++ === 0) {
    window.addEventListener(COOKIE_CONSENT_EVENT, update);
    window.addEventListener("hashchange", update);
    update();
  }
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    if (--users > 0) return;
    window.removeEventListener(COOKIE_CONSENT_EVENT, update);
    window.removeEventListener("hashchange", update);
    pause();
  };
}

function update() { sendPageview(window.location.href); }
