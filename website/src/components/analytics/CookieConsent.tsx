"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  clearAnalyticsCookies,
  COOKIE_SETTINGS_EVENT,
  readCookieConsent,
  saveCookieConsent,
  type CookieConsent,
} from "@/lib/cookieConsent";

const buttonClass = "min-h-11 rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function CookieSettingsLink() {
  return (
    <button
      type="button"
      className="inline-flex min-h-11 items-center text-left transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      onClick={() => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))}
    >
      Cookie settings
    </button>
  );
}

export default function CookieConsentBanner() {
  const [choice, setChoice] = useState<CookieConsent | null>(null);
  const [ready, setReady] = useState(false);
  const [managing, setManaging] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);
  const analyticsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = readCookieConsent();
    setChoice(saved);
    setAnalytics(saved?.analytics ?? false);
    setAdvertising(saved?.ads ?? false);
    setReady(true);
    const openSettings = () => {
      const saved = readCookieConsent();
      setAnalytics(saved?.analytics ?? false);
      setAdvertising(saved?.ads ?? false);
      setManaging(true);
    };
    window.addEventListener(COOKIE_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, openSettings);
  }, []);

  useEffect(() => {
    if (managing) analyticsRef.current?.focus();
  }, [managing]);

  function save(analyticsEnabled: boolean, advertisingEnabled: boolean) {
    const next = { analytics: analyticsEnabled, ads: advertisingEnabled };
    saveCookieConsent(next);
    if (!analyticsEnabled) clearAnalyticsCookies();
    setChoice(next);
    setAnalytics(analyticsEnabled);
    setAdvertising(advertisingEnabled);
    setManaging(false);
  }

  if (!ready || (choice && !managing)) return null;

  return (
    <section
      aria-label="Cookie preferences"
      className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-modal mx-auto max-h-[calc(100dvh-6rem)] max-w-2xl overflow-y-auto rounded-2xl border border-line bg-card p-4 text-ink shadow-card-lg sm:bottom-4 sm:p-5"
    >
      <h2 className="text-base font-bold">Cookie choices</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        Essential cookies keep the site working. Optional analytics helps us understand visits. Advertising is a separate choice for when we display ads. Read our{" "}
        <Link href="/cookie-policy" className="hit-44 font-semibold text-primary underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Cookie Policy
        </Link>.
      </p>

      {managing && (
        <div className="mt-4 rounded-xl border border-line p-3">
          <p className="text-sm font-semibold">Essential cookies are always on</p>
          <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
            <input
              ref={analyticsRef}
              type="checkbox"
              checked={analytics}
              onChange={(event) => setAnalytics(event.target.checked)}
              className="h-5 w-5 accent-primary"
            />
            <span className="text-sm">Allow analytics cookies</span>
          </label>
          <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg focus-within:outline focus-within:outline-2 focus-within:outline-primary">
            <input type="checkbox" checked={advertising} onChange={(event) => setAdvertising(event.target.checked)} className="h-5 w-5 accent-primary" />
            <span className="text-sm">Advertising — allow cookies and identifiers when we display ads</span>
          </label>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {managing ? (
          <>
            <button type="button" className={`${buttonClass} bg-primary text-white`} onClick={() => save(analytics, advertising)}>Save choices</button>
            <button type="button" className={`${buttonClass} border border-line`} onClick={() => save(false, false)}>Withdraw optional consent</button>
            {choice && <button type="button" className={`${buttonClass} border border-line`} onClick={() => setManaging(false)}>Cancel</button>}
          </>
        ) : (
          <>
            <button type="button" className={`${buttonClass} bg-primary text-white`} onClick={() => save(true, true)}>Accept all</button>
            <button type="button" className={`${buttonClass} border border-line`} onClick={() => save(false, false)}>Reject non-essential</button>
            <button type="button" className={`${buttonClass} border border-line`} onClick={() => setManaging(true)}>Manage</button>
          </>
        )}
      </div>
    </section>
  );
}
