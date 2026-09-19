import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Building2, MapPin, Clock, Wallet, ExternalLink } from "lucide-react";
import { timeAgo } from "@/lib/format";
import JsonLd from "@/components/JsonLd";
import { TagPill, Breadcrumb } from "@/components/ui";
import { absoluteUrl, breadcrumbJsonLd, jobPostingIdentifier, hiringOrganizationJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { getCachedJobDetail, getCachedRecentJobIds } from "@/lib/cache";
import { jobAvailability } from "@/lib/jobsActive";
import JobApplyPanel from "./JobApplyPanel";

export const revalidate = 300;

// `jobs.job_type` is DB-constrained (mobile-app/supabase/migrations/0010_jobs.sql)
// to exactly these 4 values. Google's JobPosting `employmentType` only accepts a
// fixed enum (FULL_TIME, PART_TIME, CONTRACTOR, TEMPORARY, INTERN, VOLUNTEER,
// PER_DIEM, OTHER) — "Internship"/"Contract" do NOT uppercase-transform into
// valid members of it, so each value is mapped explicitly instead of
// string-transformed. A `job_type` outside this map (shouldn't happen given the
// DB constraint, but the column is nullable) safely omits `employmentType`
// rather than guessing — never fabricate a value the source data doesn't support.
const EMPLOYMENT_TYPE: Record<string, string> = {
  "Full Time": "FULL_TIME",
  "Part Time": "PART_TIME",
  Internship: "INTERN",
  Contract: "CONTRACTOR",
};

// See the note in projects/[id]/page.tsx — registering generateStaticParams is
// what turns this route into ISR instead of per-request dynamic rendering.
export async function generateStaticParams() {
  return (await getCachedRecentJobIds(40)).map((id) => ({ id }));
}

const getJob = cache((id: string) => getCachedJobDetail(id));

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const job = await getJob(params.id);
  if (!job) return { title: "Job not found", robots: { index: false, follow: false } };
  if (jobAvailability(job) !== "open") {
    return { title: "Job no longer available", robots: { index: false, follow: true } };
  }
  const company = job.company_name || job.company?.name || "a CampusEduX employer";
  return {
    title: `${job.title} at ${company}`,
    description: (job.description || `${job.title} — ${company}`).slice(0, 155),
    alternates: { canonical: absoluteUrl(`/jobs/${params.id}`) },
    openGraph: {
      title: `${job.title} at ${company}`,
      url: absoluteUrl(`/jobs/${params.id}`),
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: "summary", title: `${job.title} at ${company}` },
  };
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const job = await getJob(params.id);
  if (!job) notFound();
  const availability = jobAvailability(job);
  if (availability === "draft") notFound();
  if (availability === "closed") {
    const closedCompany = job.company_name || job.company?.name || "this employer";
    return (
      <div className="container-prose py-16 text-center">
        <Breadcrumb className="mb-8 text-left" items={[{ label: "Jobs", href: "/jobs" }, { label: job.title }]} />
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">This job is no longer accepting applications</h1>
        <p className="mt-3 text-ink-muted">
          {job.title} at {closedCompany} has closed or expired. Browse other openings that are still live.
        </p>
        <div className="mt-6">
          <Link
            href="/jobs"
            className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:opacity-90"
          >
            Browse open jobs
          </Link>
        </div>
      </div>
    );
  }

  const company = job.company_name || job.company?.name || "CampusEduX employer";
  const logo = job.company_logo_url || job.company?.logo_url || null;

  const deadline: string | null = job.application_deadline ?? null;
  const applyUrl: string | null = job.apply_url ?? null;
  const facts: [string, string | null][] = [
    ["Category", job.category],
    ["Experience", job.experience],
    ["Qualification", job.qualification],
    ["Shift", job.shift],
    ["Requisition ID", job.requisition_id],
    ["Benefits", job.benefits?.length ? job.benefits.join(", ") : null],
    ["Apply by", deadline ? new Date(deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : null],
  ];

  const jobJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || job.title,
    identifier: jobPostingIdentifier(company, job.id),
    datePosted: job.posted_at,
    employmentType: job.job_type ? EMPLOYMENT_TYPE[job.job_type] : undefined,
    hiringOrganization: hiringOrganizationJsonLd({ name: company, logoUrl: logo, website: job.company?.website ?? null }),
    jobLocation: { "@type": "Place", address: job.location || "India" },
  };
  if (deadline) jobJsonLd.validThrough = deadline;
  if (job.salary_min_lpa && job.salary_max_lpa) {
    jobJsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "INR",
      value: { "@type": "QuantitativeValue", minValue: job.salary_min_lpa, maxValue: job.salary_max_lpa, unitText: "YEAR" },
    };
  }

  const applyButton = applyUrl ? (
    <a
      href={applyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:opacity-90"
    >
      Apply on company site <ExternalLink className="h-4 w-4" aria-hidden />
    </a>
  ) : null;

  return (
    <div className="container-prose py-8 sm:py-10">
      <JsonLd data={jobJsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Jobs", path: "/jobs" },
          { name: job.title, path: `/jobs/${job.id}` },
        ])}
      />

      <Breadcrumb className="mb-6" items={[{ label: "Jobs", href: "/jobs" }, { label: job.title }]} />

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

      {job.summary && <p className="mt-6 text-ink">{job.summary}</p>}
      {applyButton && <div className="mt-6">{applyButton}</div>}

      {facts.some(([, v]) => v) && (
        <dl className="mt-6 grid gap-x-6 gap-y-3 rounded-2xl border border-line bg-white p-5 shadow-card sm:grid-cols-2">
          {facts.map(([k, v]) =>
            v ? (
              <div key={k}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{k}</dt>
                <dd className="mt-0.5 text-sm text-ink">{v}</dd>
              </div>
            ) : null,
          )}
        </dl>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-bold text-ink">{job.responsibilities?.length ? "About the role" : "Description"}</h2>
        <p className="mt-2 whitespace-pre-line text-ink-muted">{job.description || "No description provided."}</p>
      </section>

      {job.responsibilities?.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-ink">What you&apos;ll work on</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-muted">
            {job.responsibilities.map((r: string) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      )}

      {job.requirements?.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-ink">{job.responsibilities?.length ? "What they\u2019re looking for" : "Requirements"}</h2>
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
        <section className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-card">
          <h2 className="text-lg font-bold text-ink">About {company}</h2>
          <p className="mt-2 text-sm text-ink-muted">{job.company.about}</p>
        </section>
      )}

      {job.candidate_note && (
        <p className="mt-8 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
          <strong className="text-ink">Note for candidates:</strong> {job.candidate_note}
        </p>
      )}

      {applyButton && <div className="mt-8">{applyButton}</div>}
      <JobApplyPanel jobId={job.id} externalApply={!!applyUrl} />
      {!applyUrl && (
        <p className="mt-4 text-xs text-ink-faint">
          You can also apply and track status from the CampusEduX app — it&apos;s the same account either way.
        </p>
      )}
    </div>
  );
}
