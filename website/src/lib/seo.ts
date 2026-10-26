import { BRAND } from "@/lib/brand";
import { BRAND_ASSETS } from "@/lib/brandAssets";

/** Keep our www origin consistent even when an environment uses the apex alias. */
export function normalizeSiteUrl(value?: string): string {
  if (!value?.trim()) return BRAND.website;
  const url = new URL(value.trim());
  if (["campusedux.com", "www.campusedux.com"].includes(url.hostname)) return BRAND.website;
  return url.origin;
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

/** Default listing pages contain distinct results; facets retain their existing hub canonical. */
export function listingCanonical(path: string, page: number, filtered = false): string {
  return absoluteUrl(`${path}${!filtered && page > 1 ? `?page=${page}` : ""}`);
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

// Next.js metadata objects replace per-key rather than deep-merge: a page
// that sets its own `openGraph` (almost every route here, for a custom
// title/description) fully shadows the layout's `openGraph.images`. So the
// sitewide fallback has to be listed explicitly in each page's own
// `openGraph.images` when it has no image of its own — this is that shared
// value (the static full-logo card, public/brand/og-image.png, 1200x630).
export const DEFAULT_OG_IMAGE = absoluteUrl(BRAND_ASSETS.ogImage.src);

/** Absolute URL of the square CX logo mark, for schema.org `Organization.logo`. */
export const BRAND_LOGO_URL = absoluteUrl(BRAND_ASSETS.logoMark.src);

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

/** The site's own Organization node (author/publisher of first-party content). */
export function organizationRef(): Record<string, unknown> {
  return { "@type": "Organization", name: BRAND.name, url: SITE_URL, logo: BRAND_LOGO_URL };
}

/**
 * schema.org TechArticle for a Learning lesson. Every field comes from the
 * lesson row: `dateModified` is the topic's real `updated_at` (omitted when
 * missing/invalid), `isPartOf` is the lesson's course (grid), and
 * `isAccessibleForFree` is emitted only for a free lesson — a premium lesson's
 * body is never server-rendered, so no paywall markup is claimed for it.
 */
export function techArticleJsonLd(input: {
  headline: string;
  description: string;
  path: string;
  courseName: string;
  coursePath: string;
  sectionName?: string | null;
  dateModified?: string | null;
  imagePath?: string | null;
  isPremium: boolean;
}): Record<string, unknown> {
  const url = absoluteUrl(input.path);
  const modified = input.dateModified && !Number.isNaN(Date.parse(input.dateModified)) ? input.dateModified : null;
  const headline = input.headline.length > 110 ? `${input.headline.slice(0, 109).trimEnd()}…` : input.headline;
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline,
    name: input.headline,
    description: input.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: "en",
    learningResourceType: "Lesson",
    ...(input.sectionName ? { articleSection: input.sectionName } : {}),
    ...(modified ? { dateModified: modified } : {}),
    ...(input.imagePath ? { image: absoluteUrl(input.imagePath) } : {}),
    author: organizationRef(),
    publisher: organizationRef(),
    isPartOf: {
      "@type": "Course",
      name: input.courseName,
      url: absoluteUrl(input.coursePath),
      provider: { "@type": "Organization", name: BRAND.name },
    },
    ...(input.isPremium ? {} : { isAccessibleForFree: true }),
  };
}
