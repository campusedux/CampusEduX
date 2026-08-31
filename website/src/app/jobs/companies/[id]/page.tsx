import { notFound } from "next/navigation";
import { getPublicSupabase } from "@/lib/supabase/server";
import JobCard, { JobCardData } from "@/components/JobCard";

export const revalidate = 300;

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const supabase = getPublicSupabase();
  if (!supabase) notFound();

  const [{ data: company }, { data: jobs }] = await Promise.all([
    supabase.from("companies").select("*").eq("id", params.id).single(),
    supabase.from("jobs").select("id,title,company_name,location,job_type,salary_range,skills,posted_at").eq("company_id", params.id).order("posted_at", { ascending: false }),
  ]);

  if (!company) notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <h1 className="font-serif text-3xl text-navy">{company.name}</h1>
      <p className="mt-3 max-w-2xl text-slate">{company.about || "No company description provided yet."}</p>
      <div className="mt-3 text-sm text-slate">{company.employee_count} · {company.rating > 0 ? `★ ${company.rating.toFixed(1)}` : "No ratings yet"}</div>

      <h2 className="mt-10 font-serif text-xl text-navy">Open roles</h2>
      {(!jobs || jobs.length === 0) ? (
        <div className="empty-state mt-4">No open roles listed right now.</div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(jobs as JobCardData[]).map((j) => <JobCard key={j.id} job={j} />)}
        </div>
      )}
    </div>
  );
}
