import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Building2, Clock, MapPin, Wallet } from "lucide-react";
import { timeAgo } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
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
    <Badge tone="neutral" className={className}>{level}</Badge>
  );
}

/**
 * Job card: company logo + role + company, Fresher/Experienced and job-type
 * badges, location, salary and posted date. Links to the job page, where
 * "Apply" opens the employer's site in a new tab.
 */
export function JobCard({ job, className }: { job: JobCardData; className?: string }) {
  return (
    <Link href={`/jobs/${job.id}`} className={cn("card card-hover group flex min-w-0 flex-col p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 max-md:p-3", className)}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface">
          {job.company_logo_url ? (
            <Image src={job.company_logo_url} alt={job.company_name ?? ""} width={40} height={40} className="h-full w-full object-contain p-1" />
          ) : (
            <Building2 className="h-5 w-5 text-accent-sky" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 break-words font-display text-base font-semibold leading-6 tracking-tight text-ink [overflow-wrap:anywhere] group-hover:text-primary max-md:text-[15px] max-md:leading-snug">
            {job.title}
          </h3>
          <p className="mt-0.5 truncate text-sm text-ink-muted">{job.company_name || "Company"}</p>
        </div>
        <ArrowUpRight
          className="h-5 w-5 flex-shrink-0 text-ink-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transform-none"
          aria-hidden
        />
      </div>

      <div className="mb-3 mt-3 flex flex-wrap items-center gap-1.5 max-md:mb-2 max-md:mt-2">
        <ExperienceBadge level={job.experience_level} />
        {job.job_type && (
          <Badge>{job.job_type}</Badge>
        )}
        {isNew(job.posted_at) && (
          <Badge variant="new">New</Badge>
        )}
      </div>

      <div className="mt-auto grid gap-1 border-t border-line pt-2 text-xs text-ink-muted max-md:grid-cols-2 max-md:border-0 max-md:pt-0">
        {job.location && (
          <span className="inline-flex min-w-0 items-start gap-2">
            <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden />
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">{job.location}</span>
          </span>
        )}
        <span className="inline-flex min-w-0 items-start gap-2 font-semibold text-ink">
          <Wallet className="h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden />
          <span className="min-w-0 break-words [overflow-wrap:anywhere]">{job.salary_range || "Salary undisclosed"}</span>
        </span>
        {job.posted_at && (
          <span className="inline-flex items-center gap-2 text-ink-faint max-md:hidden">
            <Clock className="h-4 w-4" aria-hidden />
            {timeAgo(job.posted_at)}
          </span>
        )}
      </div>
    </Link>
  );
}

export default JobCard;
