import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Building2, MapPin, Clock, Wallet } from "lucide-react";
import { getPublicSupabase } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/format";
import JsonLd from "@/components/JsonLd";
import { TagPill } from "@/components/ui";
import JobApplyPanel from "./JobApplyPanel";

export const revalidate = 300;

const getJob = cache(async (id: string) => {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("jobs")
    .select("*, company:companies(id, name, logo_url, about)")
    .eq("id", id)
    .single();
  return data;
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const job = await getJob(params.id);
  if (!job) return { title: "Job not found" };
  const company = job.company_name || job.company?.name || "a CampusEduX employer";
  return {
    title: `${job.title} at ${company}`,
    description: (job.description || `${job.title} — ${company}`).slice(0, 155),
  };
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const job = await getJob(params.id);
  if (!job) notFound();

  const company = job.company_name || job.company?.name || "CampusEduX employer";
  const logo = job.company_logo_url || job.company?.logo_url || null;

  const jobJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || job.title,
    datePosted: job.posted_at,
    employmentType: job.job_type?.toUpperCase().replace(" ", "_"),
    hiringOrganization: { "@type": "Organization", name: company },
    jobLocation: { "@type": "Place", address: job.location || "India" },
  };
  if (job.salary_min_lpa && job.salary_max_lpa) {
    jobJsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "INR",
      value: { "@type": "QuantitativeValue", minValue: job.salary_min_lpa, maxValue: job.salary_max_lpa, unitText: "YEAR" },
    };
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd data={jobJsonLd} />

      <div className="flex items-start gap-4">
        <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-50">
          {logo ? (
            <Image src={logo} alt={company} width={56} height={56} className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-6 w-6 text-primary" aria-hidden />
          )}
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">{job.title}</h1>
          <div className="mt-1 text-sm text-ink-muted">
            {job.company?.id ? (
              <Link href={`/jobs/companies/${job.company.id}`} className="font-medium text-primary hover:underline">
                {company}
              </Link>
            ) : (
              company
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5 text-sm text-ink-muted">
        {job.job_type && (
          <span className="rounded-lg bg-primary-50 px-2.5 py-1 text-[0.75rem] font-semibold text-primary">{job.job_type}</span>
        )}
        {job.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" aria-hidden /> {job.location}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Wallet className="h-4 w-4" aria-hidden /> {job.salary_range || "Salary not disclosed"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-4 w-4" aria-hidden /> Posted {timeAgo(job.posted_at)}
        </span>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-ink">Description</h2>
        <p className="mt-2 whitespace-pre-line text-ink-muted">{job.description || "No description provided."}</p>
      </section>

      {job.requirements?.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-ink">Requirements</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-muted">
            {job.requirements.map((r: string) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      )}

      {job.skills?.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-ink">Skills</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {job.skills.map((s: string) => (
              <TagPill key={s}>{s}</TagPill>
            ))}
          </div>
        </section>
      )}

      {job.company?.about && (
        <section className="mt-8 rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-lg font-bold text-ink">About {company}</h2>
          <p className="mt-2 text-sm text-ink-muted">{job.company.about}</p>
        </section>
      )}

      <JobApplyPanel jobId={job.id} />
      <p className="mt-4 text-xs text-ink-faint">
        You can also apply and track status from the CampusEduX app — it&apos;s the same account either way.
      </p>
    </div>
  );
}
