import { BRAND } from "@/lib/brand";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? BRAND.website;

export function absoluteUrl(path: string): string {
  return `${SITE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

// Next.js metadata objects replace per-key rather than deep-merge: a page
// that sets its own `openGraph` (almost every route here, for a custom
// title/description) fully shadows the layout's `openGraph.images` *and*
// the app/opengraph-image.tsx file-convention default for that page. So the
// sitewide fallback has to be listed explicitly in each page's own
// `openGraph.images` when it has no image of its own — this is that shared
// value, not a new asset (it's the same app/opengraph-image.tsx route).
export const DEFAULT_OG_IMAGE = absoluteUrl("/opengraph-image");

/** schema.org BreadcrumbList for a detail page. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

/** schema.org FAQPage from published FAQ rows. */
export function faqJsonLd(faqs: { question: string; answer: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/** schema.org WebSite entity for the site itself. No SearchAction — deliberately. */
export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND.name,
    url: SITE_URL,
  };
}

/** schema.org Course for a Learning grid. Only fields backed by real grid data. */
export function courseJsonLd(input: { name: string; description?: string | null; path: string }): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    provider: { "@type": "Organization", name: BRAND.name },
    url: absoluteUrl(input.path),
  };
}

/** schema.org ItemList of Course entities — for a fixed, unfiltered summary page only. */
export function courseListJsonLd(
  items: { name: string; description?: string | null; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(it.path),
      item: {
        "@type": "Course",
        name: it.name,
        ...(it.description ? { description: it.description } : {}),
        provider: { "@type": "Organization", name: BRAND.name },
      },
    })),
  };
}

/** schema.org PropertyValue identifier for a JobPosting — the real job id, nothing invented. */
export function jobPostingIdentifier(orgName: string, jobId: string): Record<string, unknown> {
  return { "@type": "PropertyValue", name: orgName, value: jobId };
}

/**
 * schema.org hiringOrganization for a JobPosting. `logo` / `sameAs` are added
 * only when the underlying `companies` row actually has a `logo_url` /
 * `website` value — never fabricated.
 */
export function hiringOrganizationJsonLd(input: {
  name: string;
  logoUrl?: string | null;
  website?: string | null;
}): Record<string, unknown> {
  return {
    "@type": "Organization",
    name: input.name,
    ...(input.logoUrl ? { logo: input.logoUrl } : {}),
    ...(input.website ? { sameAs: input.website } : {}),
  };
}
