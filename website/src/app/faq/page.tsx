import { getPublicSupabase } from "@/lib/supabase/server";
import JsonLd from "@/components/JsonLd";

export const revalidate = 300;
export const metadata = { title: "Frequently Asked Questions" };

export default async function FaqPage() {
  const supabase = getPublicSupabase();
  let faqs: any[] = [];
  if (supabase) {
    const { data } = await supabase.from("faqs").select("*").eq("status", "active").order("sort_order");
    faqs = data ?? [];
  }

  const grouped = faqs.reduce<Record<string, any[]>>((acc, f) => {
    (acc[f.category] ??= []).push(f);
    return acc;
  }, {});

  const faqJsonLd = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  } : null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <h1 className="text-3xl text-ink">Frequently Asked Questions</h1>
      {faqs.length === 0 ? (
        <div className="empty-state mt-8">FAQs are managed from the admin panel CMS and will appear here once published.</div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mt-10">
            <h2 className="text-lg text-ink">{category}</h2>
            <div className="mt-3 divide-y divide-line border-t border-line">
              {items.map((f) => (
                <details key={f.id} className="py-4">
                  <summary className="cursor-pointer text-ink">{f.question}</summary>
                  <p className="mt-2 text-sm text-ink-muted">{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
