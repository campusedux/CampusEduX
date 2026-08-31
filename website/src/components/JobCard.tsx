import Link from "next/link";
import Image from "next/image";
import { Building2, MapPin } from "lucide-react";
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
};

const NEW_WINDOW_DAYS = 7;

function isNew(postedAt: string | null): boolean {
  if (!postedAt) return false;
  return Date.now() - new Date(postedAt).getTime() < NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Job card — mirrors `mobile-app/src/components/cards/JobCard.tsx`: logo tile,
 * title + company, a job-type chip + location + NEW pill, salary + posted time.
 */
export function JobCard({ job, className }: { job: JobCardData; className?: string }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className={cn(
        "block rounded-2xl border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-lg",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-50">
          {job.company_logo_url ? (
            <Image src={job.company_logo_url} alt={job.company_name ?? ""} width={48} height={48} className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-5 w-5 text-primary" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-ink">{job.title}</h3>
          <p className="truncate text-sm text-ink-muted">{job.company_name || "Company"}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {job.job_type && (
          <span className="rounded-lg bg-primary-50 px-2.5 py-1 text-[0.7rem] font-semibold text-primary">
            {job.job_type}
          </span>
        )}
        {job.location && (
          <span className="inline-flex items-center gap-1 text-xs text-ink-faint">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            <span className="truncate">{job.location}</span>
          </span>
        )}
        {isNew(job.posted_at) && (
          <span className="rounded-lg bg-success/15 px-2 py-1 text-[0.7rem] font-semibold text-success">NEW</span>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-primary">{job.salary_range || "Salary undisclosed"}</span>
        {job.posted_at && <span className="text-xs text-ink-faint">{timeAgo(job.posted_at)}</span>}
      </div>
    </Link>
  );
}

export default JobCard;
