import { getPublicSupabase } from "@/lib/supabase/server";

export const revalidate = 300;
export const metadata = { title: "Resume Templates" };

export default async function ResumeTemplatesPage() {
  const supabase = getPublicSupabase();
  let templates: any[] = [];
  if (supabase) {
    const { data } = await supabase.from("resume_templates").select("*").order("sort_order");
    templates = data ?? [];
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <h1 className="font-serif text-3xl text-navy">Resume Templates</h1>
      {templates.length === 0 ? (
        <div className="empty-state mt-8">Templates will appear here once the catalog is connected.</div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((t) => (
            <div key={t.id} className="border border-navy/10 bg-white p-5">
              <div className="h-2 w-10" style={{ background: t.accent_color }} />
              <h2 className="mt-3 font-serif text-lg text-navy">{t.name}</h2>
              <p className="mt-1 text-sm text-slate">{t.description}</p>
              {t.is_premium && <span className="mt-2 inline-block rounded-sm bg-marigold px-2 py-0.5 text-xs font-semibold text-navy">Premium</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
