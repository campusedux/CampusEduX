import { getPublicSupabase } from "@/lib/supabase/server";
import JobCard, { JobCardData } from "@/components/JobCard";

export const revalidate = 120;
export const metadata = { title: "Jobs & Internships" };

export default async function JobsPage({
  searchParams,
}: {
  searchParams: { q?: string; location?: string; type?: string };
}) {
  const supabase = getPublicSupabase();
  let jobs: JobCardData[] = [];

  if (supabase) {
    let query = supabase
      .from("jobs")
      .select("id,title,company_name,location,job_type,salary_range,skills,posted_at")
      .order("posted_at", { ascending: false })
      .limit(48);

    if (searchParams.q) query = query.ilike("title", `%${searchParams.q}%`);
    if (searchParams.location) query = query.ilike("location", `%${searchParams.location}%`);
    if (searchParams.type) query = query.eq("job_type", searchParams.type);

    const { data } = await query;
    jobs = (data ?? []) as JobCardData[];
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="font-serif text-3xl text-navy">Jobs &amp; Internships</h1>
      <p className="mt-2 max-w-2xl text-slate">Roles posted for CampusEduX students — filter by role, location or type, and apply from inside the app.</p>

      <form className="mt-6 flex flex-wrap gap-3" action="/jobs" method="get">
        <input type="text" name="q" defaultValue={searchParams.q} placeholder="Job title…" className="border border-navy/20 bg-white px-3 py-2 text-sm" />
        <input type="text" name="location" defaultValue={searchParams.location} placeholder="Location…" className="border border-navy/20 bg-white px-3 py-2 text-sm" />
        <select name="type" defaultValue={searchParams.type ?? ""} className="border border-navy/20 bg-white px-3 py-2 text-sm">
          <option value="">All types</option>
          <option value="Full Time">Full Time</option>
          <option value="Part Time">Part Time</option>
          <option value="Internship">Internship</option>
          <option value="Contract">Contract</option>
        </select>
        <button className="border border-navy px-4 py-2 text-sm text-navy hover:bg-navy hover:text-paper">Search</button>
      </form>

      {jobs.length === 0 ? (
        <div className="empty-state mt-8">No roles match yet — try broadening the search.</div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((j) => <JobCard key={j.id} job={j} />)}
        </div>
      )}
    </div>
  );
}
