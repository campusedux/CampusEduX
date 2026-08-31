import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import JobCard, { JobCardData } from "@/components/JobCard";
import { EmptyState, Button } from "@/components/ui";

export default async function SavedJobsPage() {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const { data } = await supabase
    .from("saved_jobs")
    .select("job:jobs(id,title,company_name,company_logo_url,location,job_type,salary_range,posted_at)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const jobs = (data ?? [])
    .map((r) => (Array.isArray(r.job) ? r.job[0] : r.job))
    .filter(Boolean) as unknown as JobCardData[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Saved jobs</h1>
      {jobs.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No saved jobs yet"
          action={<Button href="/jobs" size="sm">Find roles</Button>}
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {jobs.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      )}
    </div>
  );
}
