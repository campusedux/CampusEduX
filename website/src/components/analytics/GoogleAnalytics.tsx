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
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
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
