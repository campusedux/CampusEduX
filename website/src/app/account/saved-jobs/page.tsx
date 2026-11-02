import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import JobCard, { JobCardData } from "@/components/JobCard";
import { EmptyState, Button } from "@/components/ui";
import { Heart } from "lucide-react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";

export default async function SavedJobsPage() {
  const user = await requireUser();
  const supabase = await createAuthedServerSupabase();

  const { data } = await supabase
    .from("saved_jobs")
    .select("job:jobs(id,title,company_name,company_logo_url,location,job_type,salary_range,posted_at)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    // This un-paginated list is bounded to the 100 most recently saved jobs so
    // the query can't grow without limit.
    .limit(100);

  const jobs = (data ?? [])
    .map((r) => (Array.isArray(r.job) ? r.job[0] : r.job))
    .filter(Boolean) as unknown as JobCardData[];

  return (
    <div>
      <AccountPageHeader title="Saved jobs" description="Roles you've bookmarked to come back to." />
      {jobs.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No saved jobs yet"
          action={<Button href="/jobs" size="sm">Find roles</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
          {jobs.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      )}
    </div>
  );
}
