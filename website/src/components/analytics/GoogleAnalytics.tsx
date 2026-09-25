import Script from "next/script";
import { Suspense } from "react";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";
import AnalyticsPageView from "./AnalyticsPageView";

// Server component: renders nothing (no script tags, no route-change
// listener) when NEXT_PUBLIC_GA_MEASUREMENT_ID isn't set, so GA4 is fully
// opt-in per environment.
export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      {/* lazyOnload, not afterInteractive: in the App Router an afterInteractive
          `src` script is also emitted as a high-priority <link rel="preload"> in
          <head>, so the ~170KB gtag.js competed with CSS/fonts/app JS on every
          first load. lazyOnload fetches it only after `load`, when idle. Hits
          aren't lost: the inline init below defines gtag() and queues into
          dataLayer, which gtag.js drains once it arrives. */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
      {/* useSearchParams requires a Suspense boundary; isolating it here
          keeps the rest of the root layout tree statically rendered. */}
      <Suspense fallback={null}>
        <AnalyticsPageView />
      </Suspense>
    </>
  );
}
