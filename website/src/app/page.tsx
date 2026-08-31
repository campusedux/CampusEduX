import Link from "next/link";
import { getPublicSupabase } from "@/lib/supabase/server";
import ProjectCard, { ProjectCardData } from "@/components/ProjectCard";
import JobCard, { JobCardData } from "@/components/JobCard";

export const revalidate = 300; // 5 min ISR — catalog data changes via admin panel, not every request

async function getHomeData() {
  const supabase = getPublicSupabase();
  if (!supabase) {
    return { categories: [], trending: [], premiumProjects: [], jobs: [], testimonials: [], faqs: [] };
  }

  const [categories, trending, premiumProjects, jobs, testimonials, faqs] = await Promise.all([
    supabase.from("categories").select("id,name,icon,project_count").order("project_count", { ascending: false }).limit(8),
    supabase
      .from("projects")
      .select("id,title,category_name,tech_stack,price,rating,review_count,thumbnail_url,is_premium,is_best_seller")
      .order("sales_count", { ascending: false })
      .limit(8),
    supabase
      .from("projects")
      .select("id,title,category_name,tech_stack,price,rating,review_count,thumbnail_url,is_premium,is_best_seller")
      .eq("is_premium", true)
      .limit(4),
    supabase
      .from("jobs")
      .select("id,title,company_name,location,job_type,salary_range,skills,posted_at")
      .order("posted_at", { ascending: false })
      .limit(6),
    supabase.from("testimonials").select("id,author_name,author_role,quote").eq("status", "active").order("sort_order").limit(6),
    supabase.from("faqs").select("id,question,answer").eq("status", "active").order("sort_order").limit(5),
  ]);

  return {
    categories: categories.data ?? [],
    trending: (trending.data ?? []) as ProjectCardData[],
    premiumProjects: (premiumProjects.data ?? []) as ProjectCardData[],
    jobs: (jobs.data ?? []) as JobCardData[],
    testimonials: testimonials.data ?? [],
    faqs: faqs.data ?? [],
  };
}

export default async function HomePage() {
  const { categories, trending, premiumProjects, jobs, testimonials, faqs } = await getHomeData();

  return (
    <div>
      <header className="mx-auto max-w-6xl px-6 pb-16 pt-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-end">
          <div>
            <div className="mb-4 text-sm text-slate">Projects · Jobs · Placement Prep · Resume · Custom Projects</div>
            <h1 className="max-w-xl font-serif text-4xl leading-tight text-navy md:text-5xl">
              Everything a student needs for a career, in one place.
            </h1>
            <p className="mt-4 max-w-lg text-slate">
              Buy or sell final-year projects, apply to jobs and internships, prepare for placements, build a resume, and get a custom project built — all on one platform.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/projects" className="rounded-sm bg-navy px-5 py-2.5 text-sm text-paper hover:bg-navy/90">Explore Projects</Link>
              <Link href="/jobs" className="rounded-sm border border-navy px-5 py-2.5 text-sm text-navy hover:bg-navy hover:text-paper">Find Jobs</Link>
              <Link href="/placement" className="rounded-sm border border-navy px-5 py-2.5 text-sm text-navy hover:bg-navy hover:text-paper">Start Preparation</Link>
              <Link href="/resume" className="rounded-sm border border-navy px-5 py-2.5 text-sm text-navy hover:bg-navy hover:text-paper">Build Resume</Link>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="font-serif text-2xl text-navy">Browse by category</h2>
        {categories.length === 0 ? (
          <div className="empty-state mt-6">
            Categories will appear here once connected to the CampusEduX Supabase project (set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.map((c: any) => (
              <Link
                key={c.id}
                href={`/projects/category/${c.id}`}
                className="border border-navy/10 bg-white p-4 text-center hover:border-navy/30"
              >
                <div className="font-serif text-navy">{c.name}</div>
                <div className="mt-1 text-xs text-slate">{c.project_count} projects</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-navy">Trending projects</h2>
          <Link href="/projects/trending" className="text-sm text-navy hover:text-marigold">View all →</Link>
        </div>
        {trending.length === 0 ? (
          <div className="empty-state mt-6">No trending projects to show yet.</div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {trending.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </section>

      {premiumProjects.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-navy">Premium projects</h2>
            <Link href="/projects/premium" className="text-sm text-navy hover:text-marigold">View all →</Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {premiumProjects.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-navy">Latest jobs</h2>
          <Link href="/jobs" className="text-sm text-navy hover:text-marigold">View all →</Link>
        </div>
        {jobs.length === 0 ? (
          <div className="empty-state mt-6">No open roles listed yet.</div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((j) => <JobCard key={j.id} job={j} />)}
          </div>
        )}
      </section>

      <section className="bg-navy py-14 text-paper">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-serif text-2xl">Placement prep, resume, custom projects &amp; referrals</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-4">
            <Link href="/placement" className="border border-paper/20 p-5 hover:border-marigold">
              <div className="font-serif">Placement Prep</div>
              <p className="mt-2 text-sm text-paper/70">Aptitude, DSA, HR and company-wise practice.</p>
            </Link>
            <Link href="/resume" className="border border-paper/20 p-5 hover:border-marigold">
              <div className="font-serif">Resume Builder</div>
              <p className="mt-2 text-sm text-paper/70">Guided sections, ATS scoring, PDF export.</p>
            </Link>
            <Link href="/custom-projects" className="border border-paper/20 p-5 hover:border-marigold">
              <div className="font-serif">Custom Projects</div>
              <p className="mt-2 text-sm text-paper/70">Describe what you need — get it built and delivered.</p>
            </Link>
            <Link href="/referral" className="border border-paper/20 p-5 hover:border-marigold">
              <div className="font-serif">Referral Program</div>
              <p className="mt-2 text-sm text-paper/70">Invite a friend, earn wallet credit.</p>
            </Link>
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="font-serif text-2xl text-navy">What students say</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {testimonials.map((t: any) => (
              <blockquote key={t.id} className="border border-navy/10 bg-white p-5 text-sm text-slate">
                “{t.quote}”
                <footer className="mt-3 text-navy">— {t.author_name}{t.author_role ? `, ${t.author_role}` : ""}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-navy">Frequently asked questions</h2>
          <Link href="/faq" className="text-sm text-navy hover:text-marigold">All FAQs →</Link>
        </div>
        {faqs.length === 0 ? (
          <div className="empty-state mt-6">FAQs are managed from the admin panel CMS and will appear here once published.</div>
        ) : (
          <div className="mt-6 divide-y divide-navy/10 border-t border-navy/10">
            {faqs.map((f: any) => (
              <details key={f.id} className="py-4">
                <summary className="cursor-pointer font-serif text-navy">{f.question}</summary>
                <p className="mt-2 text-sm text-slate">{f.answer}</p>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
