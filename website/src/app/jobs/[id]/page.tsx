import { safeHref } from "@/lib/safeUrl";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Briefcase, Building2, MapPin, Clock, Wallet, ExternalLink } from "lucide-react";
import { timeAgo } from "@/lib/format";
import JsonLd from "@/components/JsonLd";
import { TagPill, Breadcrumb, EmptyState } from "@/components/ui";
import { ExperienceBadge } from "@/components/JobCard";
import { absoluteUrl, breadcrumbJsonLd, jobPostingIdentifier, hiringOrganizationJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { getCachedJobDetail, getCachedRecentJobIds } from "@/lib/cache";
import { authoredDescription, fitDescription, cleanText } from "@/lib/metaDescription";
import { jobTitle } from "@/lib/seoTitles";
import { BRAND } from "@/lib/brand";
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
  const title = jobTitle({ title: job.title, company: job.company_name || job.company?.name || "" });
  // What/where first (real columns only), then the posting's own summary/description.
  const facts = [job.job_type, job.work_mode, job.location].filter(Boolean).join(", ");
  const description =
    fitDescription([
      `${job.title} at ${company}${facts ? ` (${facts})` : ""}.`,
      cleanText(job.summary || job.description),
    ]) || authoredDescription(job.title);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: absoluteUrl(`/jobs/${params.id}`) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/jobs/${params.id}`),
      type: "website",
      siteName: BRAND.name,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: "summary", title, description },
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
      <div className="container-prose py-10 sm:py-14">
        <Breadcrumb className="mb-8" items={[{ label: "Jobs", href: "/jobs" }, { label: job.title }]} />
        <EmptyState
          icon={Briefcase}
          title="This job is no longer accepting applications"
          subtitle={`${job.title} at ${closedCompany} has closed or expired. Browse other openings that are still live.`}
          action={
            <Link href="/jobs" className="btn-primary">
              Browse open jobs <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          }
        />
      </div>
    );
  }

  const company = job.company_name || job.company?.name || "CampusEduX employer";
  const logo = job.company_logo_url || job.company?.logo_url || null;

  const deadline: string | null = job.application_deadline ?? null;
  const applyUrl: string | null = safeHref(job.apply_url);
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
    hiringOrganization: hiringOrganizationJsonLd({ name: company, logoUrl: logo, website: safeHref(job.company?.website) }),
    jobLocation: { "@type": "Place", address: job.location || "India" },
  };
  if (deadline) jobJsonLd.validThrough = deadline;
  // `jobs.work_mode` (migration 0114: Remote | Hybrid | On-site, nullable) is the
  // only remote signal. Google also expects `applicantLocationRequirements` for
  // a TELECOMMUTE posting, but no column records which countries may apply, so
  // it is left out rather than guessed.
  if (job.work_mode === "Remote") jobJsonLd.jobLocationType = "TELECOMMUTE";
  if (job.salary_min_lpa && job.salary_max_lpa) {
    jobJsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "INR",
      value: { "@type": "QuantitativeValue", minValue: job.salary_min_lpa, maxValue: job.salary_max_lpa, unitText: "YEAR" },
    };
  }

  // External apply — always a new tab (the employer's own site).
  const applyButton = (className = "") =>
    applyUrl ? (
      <a href={applyUrl} target="_blank" rel="noopener noreferrer" className={`btn-primary ${className}`}>
        Apply on company site <ExternalLink className="h-4 w-4" aria-hidden />
      </a>
    ) : null;
  const shownFacts = facts.filter(([, v]) => v);

  return (
    <div className="container-page pb-32 pt-6 sm:pt-8 md:pb-16">
      <JsonLd data={jobJsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Jobs", path: "/jobs" },
          { name: job.title, path: `/jobs/${job.id}` },
        ])}
      />

      <Breadcrumb className="mb-5" items={[{ label: "Jobs", href: "/jobs" }, { label: job.title }]} />

      <header className="relative overflow-hidden rounded-3xl border border-line bg-card p-6 shadow-card sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent-sky/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
          <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface">
            {logo ? (
              <Image src={logo} alt={company} width={64} height={64} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-7 w-7 text-ink-faint" aria-hidden />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[1.75rem] font-bold leading-tight tracking-tight text-ink sm:text-[2.2rem]">{job.title}</h1>
            <div className="mt-1.5 text-[15px] text-ink-muted">
              {job.company?.id ? (
                <Link href={`/jobs/companies/${job.company.id}`} className="font-semibold text-primary hover:underline">
                  {company}
                </Link>
              ) : (
                company
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <ExperienceBadge level={job.experience_level} />
              {job.job_type && (
                <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[0.7rem] font-semibold text-primary">{job.job_type}</span>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
              {job.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-ink-faint" aria-hidden /> {job.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                <Wallet className="h-4 w-4 text-ink-faint" aria-hidden /> {job.salary_range || "Salary not disclosed"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-ink-faint" aria-hidden /> Posted {timeAgo(job.posted_at)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0 max-w-3xl">
          {job.summary && <p className="text-[16.5px] leading-8 text-ink">{job.summary}</p>}

          <section className={job.summary ? "mt-8" : ""}>
            <h2 className="h-section">{job.responsibilities?.length ? "About the role" : "Description"}</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-ink-muted">{job.description || "No description provided."}</p>
          </section>

          {job.responsibilities?.length > 0 && (
            <section className="mt-8">
              <h2 className="h-section">What you&apos;ll work on</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-7 text-ink-muted marker:text-ink-faint">
                {job.responsibilities.map((r: string) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
          )}

          {job.requirements?.length > 0 && (
            <section className="mt-8">
              <h2 className="h-section">{job.responsibilities?.length ? "What they’re looking for" : "Requirements"}</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-7 text-ink-muted marker:text-ink-faint">
                {job.requirements.map((r: string) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
          )}

          {job.skills?.length > 0 && (
            <section className="mt-8">
              <h2 className="h-section">Skills</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.skills.map((s: string) => (
                  <TagPill key={s}>{s}</TagPill>
                ))}
              </div>
            </section>
          )}

          {job.company?.about && (
            <section className="card mt-8 p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold text-ink">About {company}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{job.company.about}</p>
            </section>
          )}

          {job.candidate_note && (
            <p className="mt-8 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
              <strong className="text-ink">Note for candidates:</strong> {job.candidate_note}
            </p>
          )}

          <JobApplyPanel jobId={job.id} externalApply={!!applyUrl} />
          {!applyUrl && (
            <p className="mt-4 text-xs text-ink-faint">
              You can also apply and track status from the CampusEduX app — it&apos;s the same account either way.
            </p>
          )}
        </div>

        <aside className="lg:sticky lg:top-24" aria-label="Job summary">
          <div className="card p-5">
            {applyButton("h-12 w-full")}
            {applyUrl && <p className="mt-2 text-center text-xs text-ink-faint">Opens the employer&apos;s site in a new tab</p>}
            {shownFacts.length > 0 && (
              <dl className={`space-y-3 ${applyUrl ? "mt-5 border-t border-line pt-5" : ""}`}>
                {shownFacts.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{k}</dt>
                    <dd className="mt-0.5 text-sm text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
            {!applyUrl && shownFacts.length === 0 && (
              <p className="text-sm text-ink-muted">Apply with your CampusEduX resume below.</p>
            )}
          </div>
        </aside>
      </div>

      {/* Phone: Apply stays one tap away, above the bottom tab bar. */}
      {applyUrl && (
        <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-30 border-t border-line/70 bg-card/95 px-4 py-3 backdrop-blur-xl md:bottom-0 lg:hidden">
          {applyButton("h-11 w-full")}
        </div>
      )}
    </div>
  );
}
