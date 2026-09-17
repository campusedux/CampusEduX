"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { sendPageview } from "@/lib/analytics";

// The gtag('config', ...) call in GoogleAnalytics already reports the initial
// load's page_view. This component only reports the client-side navigations
// that follow, so the first render is intentionally skipped.
export default function AnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    const query = searchParams.toString();
    sendPageview(query ? `${pathname}?${query}` : pathname);
  }, [pathname, searchParams]);

  return null;
}
