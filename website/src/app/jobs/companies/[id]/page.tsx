import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { Building2, Star } from "lucide-react";
import JobCard, { JobCardData } from "@/components/JobCard";
import JsonLd from "@/components/JsonLd";
import { EmptyState } from "@/components/ui";
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
  if (!res) return { title: "Company not found" };
  return {
    title: `${res.company.name} — jobs`,
    description: (res.company.about || `Open roles at ${res.company.name}`).slice(0, 155),
    alternates: { canonical: absoluteUrl(`/jobs/companies/${params.id}`) },
  };
}

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const res = await getCompany(params.id);
  if (!res) notFound();
  const { company, jobs } = res;

  return (
    <div className="container-page py-10">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Companies", path: "/jobs/companies" },
          { name: company.name, path: `/jobs/companies/${company.id}` },
        ])}
      />
      <div className="flex items-start gap-4">
        <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-50">
          {company.logo_url ? (
            <Image src={company.logo_url} alt={company.name} width={56} height={56} className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-6 w-6 text-primary" aria-hidden />
          )}
        </span>
        <div>
          <h1 className="text-3xl font-bold text-ink">{company.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
            {company.employee_count && <span>{company.employee_count}</span>}
            {company.rating > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-warning text-warning" aria-hidden /> {company.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 max-w-2xl text-ink-muted">{company.about || "No company description provided yet."}</p>

      <h2 className="mt-10 text-xl font-bold text-ink">Open roles</h2>
      {jobs.length === 0 ? (
        <EmptyState className="mt-4" title="No open roles right now" />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {jobs.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      )}
    </div>
  );
}
