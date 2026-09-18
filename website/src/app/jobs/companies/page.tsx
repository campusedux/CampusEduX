import type { Metadata } from "next";
import { getPublicSupabase } from "@/lib/supabase/server";
import { CompanyCard, type CompanyCardData, EmptyState } from "@/components/ui";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/seo";

const DESCRIPTION =
  "See which companies are hiring on CampusEduX and browse each employer's live job and internship openings in one place.";

export const revalidate = 300;

async function getCompanies(): Promise<CompanyCardData[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("companies")
    .select("id,name,logo_url,open_jobs_count")
    .order("open_jobs_count", { ascending: false })
    .limit(60);
  return (data ?? []) as CompanyCardData[];
}

export async function generateMetadata(): Promise<Metadata> {
  const companies = await getCompanies();
  return {
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
    // No companies listed yet -> don't index an empty shell page.
    robots: companies.length === 0 ? { index: false, follow: true } : undefined,
  };
}

export default async function CompaniesPage() {
  const companies = await getCompanies();
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
