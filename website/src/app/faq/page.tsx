import { completeSeoMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getPublicSupabase } from "@/lib/supabase/server";
import JsonLd from "@/components/JsonLd";
import Link from "next/link";
import { cache } from "react";
import { FALLBACK_FAQS, type Faq } from "@/lib/faq";
import { absoluteUrl, faqJsonLd } from "@/lib/seo";

const DESCRIPTION =
  "Frequently asked questions about CampusEduX, organised by category, with straightforward answers to help you get started or find what you need.";

export const revalidate = 300;

const getFaqs = cache(async (): Promise<Faq[]> => {
  const supabase = getPublicSupabase();
  if (!supabase) return FALLBACK_FAQS;
  try {
    const { data } = await supabase.from("faqs").select("id,question,answer,category").eq("status", "active").order("sort_order").limit(100).abortSignal(AbortSignal.timeout(5000));
    const faqs = (data ?? []).filter((f) => f.question?.trim() && f.answer?.trim()) as Faq[];
    return faqs.length ? faqs : FALLBACK_FAQS;
  } catch {
    return FALLBACK_FAQS;
  }
});

export async function generateMetadata(): Promise<Metadata> {
  const faqs = await getFaqs();
  return completeSeoMetadata({
    title: "Frequently Asked Questions",
    description: DESCRIPTION,
    alternates: { canonical: absoluteUrl("/faq") },
    // The policy-backed fallback keeps this page useful when the FAQ table is empty.
    robots: faqs.length === 0 ? { index: false, follow: true } : undefined,
  });
}

export default async function FaqPage() {
  const faqs = await getFaqs();

  const grouped = faqs.reduce<Record<string, Faq[]>>((acc, f) => {
    (acc[f.category] ??= []).push(f);
    return acc;
  }, {});

  return (
    <div className="page-shell-narrow">
      {faqs.length > 0 && <JsonLd data={faqJsonLd(faqs)} />}
      <h1 className="text-3xl font-bold text-ink max-md:text-xl max-md:font-semibold">Frequently Asked Questions</h1>
      <p className="mt-4 text-sm text-ink-muted">For account-specific help, <Link href="/contact" className="text-primary underline">contact us</Link>. See our <Link href="/terms" className="text-primary underline">Terms</Link>, <Link href="/refund-policy" className="text-primary underline">Refund Policy</Link> and <Link href="/referral" className="text-primary underline">current referral rules</Link>.</p>
      {Object.entries(grouped).map(([category, items]) => (
          <section key={category} className="mt-10 max-md:mt-8">
            <h2 className="text-lg font-bold text-ink">{category}</h2>
            <div className="mt-3 divide-y divide-line rounded-xl border border-line bg-card">
              {items.map((f) => (
                <details key={f.id} className="px-4 py-3">
                  <summary className="cursor-pointer list-none font-semibold text-ink">{f.question}</summary>
                  <p className="mt-2 text-sm text-ink-muted">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
