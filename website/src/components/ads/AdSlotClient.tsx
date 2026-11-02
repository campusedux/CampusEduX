"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { COOKIE_CONSENT_EVENT, readCookieConsent, type CookieConsent } from "@/lib/cookieConsent";
import { canLoadAdvertising, type AdPage } from "@/lib/advertising";
import { subscribeSessionChange } from "@/lib/sessionSignal";

/** Future insertion point only: no unit, publisher ID, script or ad request.
 * The server template must attest to real, published, anonymous content.
 * Place between article sections, away from navigation, downloads and editors.
 * Never mount in a layout or an error/404 boundary. Reuse canLoadAdvertising
 * at any future script loader; consent must be checked before inserting it.
 * TODO: Google-certified TCF CMP required before personalised ads in EEA/UK/CH.
 */
export function AdSlotClient({ page }: { page: AdPage }) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [verifiedPath, setVerifiedPath] = useState<string | null>(null);
  const enabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";

  useEffect(() => {
    const update = () => {
      setConsent(readCookieConsent());
      setVerifiedPath(null);
    };
    update();
    window.addEventListener(COOKIE_CONSENT_EVENT, update);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, update);
  }, []);

  useEffect(() => {
    if (!enabled || !consent?.ads) return;
    let active = true;
    let generation = 0;
    const check = async () => {
      const current = ++generation;
      setVerifiedPath(null);
      try {
        const response = await fetch("/api/session", { cache: "no-store", signal: AbortSignal.timeout(5000) });
        const body = response.ok ? await response.json() : null;
        if (active && current === generation) setVerifiedPath(body?.profile === null ? pathname : null);
      } catch { /* Fail closed if session verification is unavailable. */ }
    };
    void check();
    const unsubscribe = subscribeSessionChange(() => { void check(); });
    window.addEventListener("focus", check);
    return () => { active = false; unsubscribe(); window.removeEventListener("focus", check); };
  }, [enabled, consent, pathname]);

  if (pathname !== page.path || !canLoadAdvertising({ enabled, consent, page, anonymousVerified: verifiedPath === pathname })) return null;
  return <aside aria-label="Advertisement" data-ad-slot="reserved" />;
}
