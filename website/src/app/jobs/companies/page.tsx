import { getPublicSupabase } from "@/lib/supabase/server";
import { CompanyCard, type CompanyCardData, EmptyState } from "@/components/ui";

export const revalidate = 300;
export const metadata = { title: "Companies hiring on CampusEduX" };

export default async function CompaniesPage() {
  const supabase = getPublicSupabase();
  let companies: CompanyCardData[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("companies")
      .select("id,name,logo_url,open_jobs_count")
      .order("open_jobs_count", { ascending: false })
      .limit(60);
    companies = (data ?? []) as CompanyCardData[];
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-ink">Companies</h1>
      <p className="mt-2 text-ink-muted">Employers hiring CampusEduX students.</p>
      {companies.length === 0 ? (
        <EmptyState className="mt-8" title="No companies listed yet" />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <CompanyCard key={c.id} company={c} />
          ))}
        </div>
      )}
    </div>
  );
}
