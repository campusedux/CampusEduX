import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicSupabase } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/format";
import JsonLd from "@/components/JsonLd";
import JobApplyPanel from "./JobApplyPanel";

export const revalidate = 300;

async function getJob(id: string) {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("jobs").select("*, company:companies(name, logo_url, about)").eq("id", id).single();
  return data;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const job = await getJob(params.id);
  if (!job) return { title: "Job not found" };
  return { title: `${job.title} at ${job.company_name || job.company?.name || "CampusEduX employer"}` };
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const job = await getJob(params.id);
  if (!job) notFound();

  const jobJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || job.title,
    datePosted: job.posted_at,
    employmentType: job.job_type?.toUpperCase().replace(" ", "_"),
    hiringOrganization: {
      "@type": "Organization",
      name: job.company_name || job.company?.name || "CampusEduX employer",
    },
    jobLocation: {
      "@type": "Place",
      address: job.location || "India",
    },
  };
  if (job.salary_min_lpa && job.salary_max_lpa) {
    jobJsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "INR",
      value: { "@type": "QuantitativeValue", minValue: job.salary_min_lpa, maxValue: job.salary_max_lpa, unitText: "YEAR" },
    };
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <JsonLd data={jobJsonLd} />
      <div className="text-sm text-slate">{job.company_name || job.company?.name} · {job.location}</div>
      <h1 className="mt-1 font-serif text-3xl text-navy">{job.title}</h1>
      <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate">
        <span className="rounded-sm border border-navy/20 px-2 py-1">{job.job_type}</span>
        <span>{job.salary_range || "Salary not disclosed"}</span>
        <span>Posted {timeAgo(job.posted_at)}</span>
      </div>

      <div className="mt-8">
        <h2 className="font-serif text-xl text-navy">Description</h2>
        <p className="mt-2 whitespace-pre-line text-slate">{job.description || "No description provided."}</p>
      </div>

      {job.requirements?.length > 0 && (
        <div className="mt-8">
          <h2 className="font-serif text-xl text-navy">Requirements</h2>
          <ul className="mt-2 list-disc pl-5 text-slate">
            {job.requirements.map((r: string) => <li key={r}>{r}</li>)}
          </ul>
        </div>
      )}

      {job.skills?.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {job.skills.map((s: string) => (
            <span key={s} className="rounded-sm border border-navy/10 bg-paper px-2 py-1 text-xs text-navy">{s}</span>
          ))}
        </div>
      )}

      <JobApplyPanel jobId={job.id} />
      <p className="mt-4 text-xs text-slate">You can also apply and track application status from inside the CampusEduX app — it&apos;s the same account either way.</p>
    </div>
  );
}
