import Link from "next/link";
import { getPublicSupabase } from "@/lib/supabase/server";

export const revalidate = 300;
export const metadata = { title: "Companies hiring on CampusEduX" };

export default async function CompaniesPage() {
  const supabase = getPublicSupabase();
  let companies: any[] = [];
  if (supabase) {
    const { data } = await supabase.from("companies").select("id,name,logo_url,open_jobs_count,employee_count").order("open_jobs_count", { ascending: false }).limit(48);
    companies = data ?? [];
  }
  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="font-serif text-3xl text-navy">Companies</h1>
      {companies.length === 0 ? (
        <div className="empty-state mt-8">No companies listed yet.</div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {companies.map((c) => (
            <Link key={c.id} href={`/jobs/companies/${c.id}`} className="border border-navy/10 bg-white p-5 text-center hover:border-navy/30">
              <div className="font-serif text-navy">{c.name}</div>
              <div className="mt-1 text-xs text-slate">{c.open_jobs_count} open roles</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
