import type { Metadata } from "next";
import { getPublicSupabase } from "@/lib/supabase/server";
import { CompanyCard, type CompanyCardData, EmptyState } from "@/components/ui";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/seo";

const DESCRIPTION =
  "See which companies are hiring on CampusEduX and browse each employer's live job and internship openings in one place.";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Companies hiring on CampusEduX",
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/jobs/companies") },
  openGraph: {
    title: "Companies hiring on CampusEduX",
    description: DESCRIPTION,
    url: absoluteUrl("/jobs/companies"),
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
};

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
    <div className="page-shell">
      <h1 className="text-3xl font-bold text-ink">Companies</h1>
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
