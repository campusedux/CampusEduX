import { BRAND } from "@/lib/brand";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? BRAND.website;

export function absoluteUrl(path: string): string {
  return `${SITE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

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
