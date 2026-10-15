"use client";

import Script from "next/script";
import { Suspense, useEffect, useRef, useState } from "react";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";
import {
  COOKIE_CONSENT_EVENT,
  consentModeSignals,
  readCookieConsent,
  type CookieConsent,
} from "@/lib/cookieConsent";
import AnalyticsPageView from "./AnalyticsPageView";

const DENIED: CookieConsent = { analytics: false, ads: false };

export default function GoogleAnalytics() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [tagReady, setTagReady] = useState(false);
  const loaded = useRef(false);
  const configured = useRef(false);

  function configCurrentPage() {
    if (!GA_MEASUREMENT_ID || configured.current || !readCookieConsent()?.analytics) return;
    window.gtag?.("config", GA_MEASUREMENT_ID, {
      page_path: `${window.location.pathname}${window.location.search}`,
    });
    configured.current = true;
  }

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    // No Google script or config runs until analytics consent exists. Queue
    // Consent Mode v2 defaults before the first config or page view.
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
    window.gtag("consent", "default", consentModeSignals(DENIED));
    window.gtag("js", new Date());

    const apply = (choice: CookieConsent | null) => {
      window.gtag?.("consent", "update", consentModeSignals(choice ?? DENIED));
      const enabled = Boolean(choice?.analytics);
      if (!enabled) configured.current = false;
      setAnalyticsEnabled(enabled);
      if (enabled && loaded.current) configCurrentPage();
    };

    apply(readCookieConsent());
    const onChoice = (event: Event) => apply((event as CustomEvent<CookieConsent>).detail);
    window.addEventListener(COOKIE_CONSENT_EVENT, onChoice);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onChoice);
  }, []);

  if (!GA_MEASUREMENT_ID || !analyticsEnabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
        onReady={() => {
          loaded.current = true;
          setTagReady(true);
          configCurrentPage();
        }}
      />
      {tagReady && (
        <Suspense fallback={null}>
          <AnalyticsPageView />
        </Suspense>
      )}
    </>
  );
}
