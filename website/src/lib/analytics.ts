import { COOKIE_CONSENT_EVENT, readCookieConsent } from "@/lib/cookieConsent";
import { analyticsFrameDocument } from "@/lib/analyticsFrame";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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

let frame: HTMLIFrameElement | null = null;
let ready = false;
let pending: AnalyticsPage | null = null;
let previous = "";
let clientId: string | null = null;
let active = false;

function analyticsClientId(): string {
  // Retain the existing pseudonymous GA visitor ID without giving Google
  // access to application cookies. Accept only the numeric GA cookie shape.
  const saved = document.cookie.split("; ").find(cookie => cookie.startsWith("_ga="));
  const existing = saved?.match(/^_ga=GA\d+\.\d+\.(\d{1,20}\.\d{1,20})$/)?.[1];
  const id = existing ?? `${window.crypto.getRandomValues(new Uint32Array(1))[0]}.${Math.floor(Date.now() / 1000)}`;
  // This runs only after analytics consent and public-route validation. The
  // existing CookieConsent banner clears _ga on revocation as before.
  document.cookie = `_ga=GA1.1.${id}; Path=/; Max-Age=63072000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
  return id;
}

function stopFrame() {
  frame?.remove();
  frame = null;
  ready = false;
  pending = null;
  previous = "";
}

function deliver() {
  // Opaque sandbox origins require '*'; the receiver checks event.source.
  if (ready && pending && readCookieConsent()?.analytics) {
    frame?.contentWindow?.postMessage(pending, "*");
    previous = pending.page_location;
    pending = null;
  }
}

export function sendPageview(value: string) {
  if (!active || !GA_MEASUREMENT_ID || typeof window === "undefined") return;
  const origin = window.location.origin;
  // A caller cannot disguise an auth page by supplying a public path.
  // Never alter history or consume authentication credentials.
  const current = analyticsPage(window.location.href, origin);
  const page = analyticsPage(value, origin, previous || document.referrer);
  if (!readCookieConsent()?.analytics || !current || !page || current.page_path !== page.page_path) {
    stopFrame();
    return;
  }
  pending = page;
  if (!frame) {
    clientId ??= analyticsClientId();
    const next = document.createElement("iframe");
    next.hidden = true;
    next.title = "Website analytics";
    // No allow-same-origin: Google cannot read the parent's URL, DOM,
    // cookies or history, regardless of remote Enhanced Measurement settings.
    next.setAttribute("sandbox", "allow-scripts");
    next.referrerPolicy = "no-referrer";
    next.srcdoc = analyticsFrameDocument(GA_MEASUREMENT_ID, origin, clientId);
    next.onload = () => {
      if (frame !== next) return;
      ready = true;
      deliver();
    };
    frame = next;
    document.body.appendChild(next);
  }
  deliver();
}

export function initializeAnalytics(): () => void {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID || !/^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID)) return () => {};
  active = true;
  const update = () => {
    if (!readCookieConsent()?.analytics) clientId = null;
    sendPageview(window.location.href);
  };
  window.addEventListener(COOKIE_CONSENT_EVENT, update);
  window.addEventListener("hashchange", update);
  update();
  return () => {
    active = false;
    window.removeEventListener(COOKIE_CONSENT_EVENT, update);
    window.removeEventListener("hashchange", update);
    stopFrame();
    clientId = null;
  };
}
