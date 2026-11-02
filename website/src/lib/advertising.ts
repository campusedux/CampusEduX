import type { CookieConsent } from "@/lib/cookieConsent";

export type AdPage = {
  path: string;
  hasContent: boolean;
  access: "public" | "protected";
  status: number;
};

/** Detail templates only. Authentication, transactions, tools and list/empty pages never qualify. */
export function isAdContentRoute(path: string): boolean {
  return /^\/(?:blog\/[a-z0-9-]+|learning\/[a-z0-9-]+(?:\/[a-z0-9-]+)?|practice\/interview-questions\/[a-z0-9-]+\/[a-z0-9-]+)$/.test(path)
    && !/^\/blog\/(?:category|tag|feed)$/.test(path);
}

export function canLoadAdvertising({ enabled, consent, page, anonymousVerified }: {
  enabled: boolean; consent: CookieConsent | null; page: AdPage; anonymousVerified: boolean;
}): boolean {
  return enabled && consent?.ads === true && anonymousVerified && page.status === 200
    && page.access === "public" && page.hasContent && isAdContentRoute(page.path);
}
