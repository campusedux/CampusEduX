import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import JobCard, { JobCardData } from "@/components/JobCard";

export default async function SavedJobsPage() {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const { data } = await supabase
    .from("saved_jobs")
    .select("job:jobs(id,title,company_name,location,job_type,salary_range,skills,posted_at)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const jobs = (data ?? []).map((r: any) => r.job).filter(Boolean) as JobCardData[];

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy">Saved jobs</h1>
      {jobs.length === 0 ? (
        <div className="empty-state mt-6">You haven&apos;t saved any jobs yet.</div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {jobs.map((j) => <JobCard key={j.id} job={j} />)}
        </div>
      )}
    </div>
  );
}
