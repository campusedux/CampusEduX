import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { Briefcase, Building2, Star } from "lucide-react";
import JobCard, { JobCardData } from "@/components/JobCard";
import JsonLd from "@/components/JsonLd";
import { Breadcrumb, EmptyState } from "@/components/ui";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { getCachedCompanyDetail, getCachedCompanyIds } from "@/lib/cache";

export const revalidate = 300;

// Registering generateStaticParams makes this ISR rather than per-request
// dynamic (see projects/[id]/page.tsx). Company set is small — prerender all.
export async function generateStaticParams() {
  return (await getCachedCompanyIds()).map((id) => ({ id }));
}

const getCompany = cache(async (id: string) => {
  const res = await getCachedCompanyDetail(id);
  return res ? { company: res.company, jobs: res.jobs as JobCardData[] } : null;
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const res = await getCompany(params.id);
  if (!res) return { title: "Company not found", robots: { index: false, follow: false } };
  return {
    title: `${res.company.name} — jobs`,
    description: (res.company.about || `Open roles at ${res.company.name}`).slice(0, 155),
    alternates: { canonical: absoluteUrl(`/jobs/companies/${params.id}`) },
    // No open roles -> just a name and a blurb; keep it out of the index
    // (the jobs sitemap lists only companies with an open job).
    robots: res.jobs.length === 0 ? { index: false, follow: true } : undefined,
  };
}

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const res = await getCompany(params.id);
  if (!res) notFound();
  const { company, jobs } = res;

  return (
    <div className="page-shell">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Companies", path: "/jobs/companies" },
          { name: company.name, path: `/jobs/companies/${company.id}` },
        ])}
      />
      <Breadcrumb
        className="mb-5"
        items={[
          { label: "Jobs", href: "/jobs" },
          { label: "Companies", href: "/jobs/companies" },
          { label: company.name },
        ]}
      />
      <header className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:p-8">
        <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface">
          {company.logo_url ? (
            <Image src={company.logo_url} alt={company.name} width={64} height={64} className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-7 w-7 text-ink-faint" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[1.75rem] font-bold tracking-tight text-ink sm:text-[2.2rem]">{company.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
            {company.employee_count && <span>{company.employee_count}</span>}
            {company.rating > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-warning text-warning" aria-hidden /> {company.rating.toFixed(1)}
              </span>
            )}
            <span>
              {jobs.length} open role{jobs.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-4 max-w-3xl leading-relaxed text-ink-muted">{company.about || "No company description provided yet."}</p>
        </div>
      </header>

      <h2 className="h-section mt-10">Open roles</h2>
      {jobs.length === 0 ? (
        <EmptyState className="mt-4" icon={Briefcase} title="No open roles right now" subtitle="Check back soon, or browse all jobs." />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      )}
    </div>
  );
}
