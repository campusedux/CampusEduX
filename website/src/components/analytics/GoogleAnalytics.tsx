"use client";

import { Suspense, useEffect } from "react";
import { initializeAnalytics } from "@/lib/analytics";
import AnalyticsPageView from "./AnalyticsPageView";

export default function GoogleAnalytics() {
  useEffect(() => initializeAnalytics(), []);

  return (
    <Suspense fallback={null}>
      <AnalyticsPageView />
    </Suspense>
  );
}
