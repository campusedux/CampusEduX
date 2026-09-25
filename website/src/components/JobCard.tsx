import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Building2, Clock, MapPin, Wallet } from "lucide-react";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

export type JobCardData = {
  id: string;
  title: string;
  company_name: string | null;
  company_logo_url?: string | null;
  location: string | null;
  job_type: string | null;
  salary_range: string | null;
  skills?: string[] | null;
  posted_at: string | null;
  /** 'Fresher' | 'Experienced' | null (jobs.experience_level, migration 0114). */
  experience_level?: string | null;
};

const NEW_WINDOW_DAYS = 7;

function isNew(postedAt: string | null): boolean {
  if (!postedAt) return false;
  return Date.now() - new Date(postedAt).getTime() < NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

/** Fresher / Experienced pill — renders nothing when the job has no level. */
export function ExperienceBadge({ level, className }: { level?: string | null; className?: string }) {
  if (level !== "Fresher" && level !== "Experienced") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide",
        level === "Fresher"
          ? "bg-accent-teal/15 text-teal-700 dark:text-teal-300"
          : "bg-accent-violet/15 text-violet-700 dark:text-violet-300",
        className,
      )}
    >
      {level}
    </span>
  );
}

/**
 * Job card: company logo + role + company, Fresher/Experienced and job-type
 * badges, location, salary and posted date. Links to the job page, where
 * "Apply" opens the employer's site in a new tab.
 */
export function JobCard({ job, className }: { job: JobCardData; className?: string }) {
  return (
    <Link href={`/jobs/${job.id}`} className={cn("card card-hover group flex flex-col p-5", className)}>
      <div className="flex items-start gap-3.5">
        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface">
          {job.company_logo_url ? (
            <Image src={job.company_logo_url} alt={job.company_name ?? ""} width={48} height={48} className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-5 w-5 text-ink-faint" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-display text-[1.05rem] font-bold leading-snug tracking-tight text-ink group-hover:text-primary">
            {job.title}
          </h3>
          <p className="mt-0.5 truncate text-sm text-ink-muted">{job.company_name || "Company"}</p>
        </div>
        <ArrowUpRight
          className="h-5 w-5 flex-shrink-0 text-ink-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transform-none"
          aria-hidden
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <ExperienceBadge level={job.experience_level} />
        {job.job_type && (
          <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[0.7rem] font-semibold text-primary">{job.job_type}</span>
        )}
        {isNew(job.posted_at) && (
          <span className="rounded-full bg-success/15 px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-success">New</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3.5 text-xs text-ink-muted">
        {job.location && (
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
            <span className="truncate">{job.location}</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1 font-semibold text-ink">
          <Wallet className="h-3.5 w-3.5 flex-shrink-0 text-ink-faint" aria-hidden />
          {job.salary_range || "Salary undisclosed"}
        </span>
        {job.posted_at && (
          <span className="ml-auto inline-flex items-center gap-1 text-ink-faint">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {timeAgo(job.posted_at)}
          </span>
        )}
      </div>
    </Link>
  );
}

export default JobCard;
