import Link from "next/link";
import { timeAgo } from "@/lib/format";

export type JobCardData = {
  id: string;
  title: string;
  company_name: string | null;
  location: string | null;
  job_type: string;
  salary_range: string | null;
  skills: string[] | null;
  posted_at: string;
};

export default function JobCard({ job }: { job: JobCardData }) {
  return (
    <Link href={`/jobs/${job.id}`} className="block border border-navy/10 bg-white p-5 transition hover:border-navy/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-base text-navy">{job.title}</h3>
          <div className="mt-1 text-sm text-slate">{job.company_name || "Company not listed"} · {job.location || "Location not specified"}</div>
        </div>
        <span className="whitespace-nowrap rounded-sm border border-navy/20 px-2 py-1 text-[0.7rem] text-navy">{job.job_type}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(job.skills ?? []).slice(0, 4).map((s) => (
          <span key={s} className="rounded-sm bg-paper px-1.5 py-0.5 text-[0.68rem] text-navy border border-navy/10">{s}</span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-slate">
        <span>{job.salary_range || "Salary not disclosed"}</span>
        <span>{timeAgo(job.posted_at)}</span>
      </div>
    </Link>
  );
}
