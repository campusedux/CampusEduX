import type { Metadata } from "next";
import { getPublicSupabase } from "@/lib/supabase/server";
import JsonLd from "@/components/JsonLd";
import { EmptyState } from "@/components/ui";
import { absoluteUrl, faqJsonLd } from "@/lib/seo";

const DESCRIPTION =
  "Frequently asked questions about CampusEduX, organised by category, with straightforward answers to help you get started or find what you need.";

export const revalidate = 300;

type Faq = { id: string; question: string; answer: string; category: string };

async function getFaqs(): Promise<Faq[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("faqs").select("id,question,answer,category").eq("status", "active").order("sort_order");
  return (data ?? []) as Faq[];
}

export async function generateMetadata(): Promise<Metadata> {
  const faqs = await getFaqs();
  return {
    title: "Frequently Asked Questions",
    description: DESCRIPTION,
    alternates: { canonical: absoluteUrl("/faq") },
    // No FAQs published yet -> don't let an empty shell page get indexed.
    robots: faqs.length === 0 ? { index: false, follow: true } : undefined,
  };
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
      {faqs.length === 0 ? (
        <EmptyState className="mt-8" title="No FAQs published yet" subtitle="FAQs are managed from the admin panel CMS." />
      ) : (
        Object.entries(grouped).map(([category, items]) => (
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
        ))
      )}
    </div>
  );
}
