import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublicSupabase } from "@/lib/supabase/server";
import ProjectCard, { ProjectCardData } from "@/components/ProjectCard";
import JobCard, { JobCardData } from "@/components/JobCard";
import { SectionHeader, CategoryCard, SearchBar, Rating } from "@/components/ui";
import { OffersStrip, type OfferBanner } from "@/components/home/OffersStrip";
import { PremiumPromo } from "@/components/home/PremiumPromo";
import { HomeLearning } from "@/components/home/HomeLearning";
import { categoryIcon, categoryVisual, inWindow } from "@/lib/home";

export const revalidate = 300; // 5-min ISR — catalog + CMS change via the admin panel, not per request

const PROJECT_FIELDS =
  "id,title,category_name,tech_stack,price,rating,review_count,thumbnail_url,is_premium,is_best_seller";
const JOB_FIELDS = "id,title,company_name,company_logo_url,location,job_type,salary_range,posted_at";

interface HomeBanner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  target_url: string | null;
}

const getHomeData = cache(async () => {
  const supabase = getPublicSupabase();
  if (!supabase) {
    return {
      categories: [] as CategoryRow[],
      trending: [] as ProjectCardData[],
      jobs: [] as JobCardData[],
      testimonials: [] as TestimonialRow[],
      faqs: [] as FaqRow[],
      banner: null as HomeBanner | null,
      offers: [] as OfferBanner[],
    };
  }

  const [categories, trending, jobs, testimonials, faqs, banners, offers] = await Promise.all([
    supabase.from("categories").select("id,name,icon,project_count").order("project_count", { ascending: false }).limit(8),
    supabase.from("projects").select(PROJECT_FIELDS).order("sales_count", { ascending: false }).limit(8),
    supabase.from("jobs").select(JOB_FIELDS).order("posted_at", { ascending: false }).limit(6),
    supabase
      .from("testimonials")
      .select("id,author_name,author_role,quote,rating")
      .eq("status", "active")
      .order("sort_order")
      .limit(6),
    supabase.from("faqs").select("id,question,answer").eq("status", "active").order("sort_order").limit(5),
    supabase
      .from("banners")
      .select("id,title,subtitle,image_url,target_url,placement,status,priority,starts_at,ends_at")
      .eq("placement", "home")
      .eq("status", "active")
      .order("priority", { ascending: false })
      .limit(5),
    supabase
      .from("offer_banners")
      .select("id,title,description,discount_label,coupon_code,is_active,sort_order")
      .eq("is_active", true)
      .order("sort_order")
      .limit(8),
  ]);

  const activeBanner =
    (banners.data ?? []).find((b) => inWindow(b.starts_at, b.ends_at)) ?? null;

  return {
    categories: (categories.data ?? []) as CategoryRow[],
    trending: (trending.data ?? []) as ProjectCardData[],
    jobs: (jobs.data ?? []) as JobCardData[],
    testimonials: (testimonials.data ?? []) as TestimonialRow[],
    faqs: (faqs.data ?? []) as FaqRow[],
    banner: activeBanner
      ? {
          id: activeBanner.id,
          title: activeBanner.title,
          subtitle: activeBanner.subtitle,
          image_url: activeBanner.image_url,
          target_url: activeBanner.target_url,
        }
      : null,
    offers: (offers.data ?? []) as OfferBanner[],
  };
});

type CategoryRow = { id: string; name: string; icon: string | null; project_count: number };
type TestimonialRow = { id: string; author_name: string; author_role: string | null; quote: string; rating: number };
type FaqRow = { id: string; question: string; answer: string };

export async function generateMetadata(): Promise<Metadata> {
  const { banner } = await getHomeData();
  return {
    title: "CampusEduX — Projects, Jobs, Placement Prep & Resume, in one app",
    description:
      "Buy or sell final-year projects, apply to jobs and internships, prepare for placements, build a resume, and get a custom project built — one account across web and the CampusEduX app.",
    openGraph: {
      title: "CampusEduX",
      description: "Projects · Jobs · Placement Prep · Resume · Custom Projects — for students.",
      images: banner?.image_url ? [{ url: banner.image_url }] : undefined,
    },
  };
}

export default async function HomePage() {
  const { categories, trending, jobs, testimonials, faqs, banner, offers } = await getHomeData();

  return (
    <div className="pb-4">
      {/* Hero — an admin `banners` row for placement 'home' overrides the default copy. */}
      <header className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-14">
        {banner ? (
          <Link
            href={banner.target_url || "/projects"}
            className="block overflow-hidden rounded-2xl border border-line bg-primary-50 shadow-card"
          >
            <div className="grid items-center gap-6 p-6 sm:grid-cols-2 sm:p-8">
              <div>
                <h1 className="text-2xl font-bold text-ink sm:text-3xl">{banner.title}</h1>
                {banner.subtitle && <p className="mt-2 text-ink-muted">{banner.subtitle}</p>}
                <span className="mt-4 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white">
                  Explore
                </span>
              </div>
              {banner.image_url && (
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
                  <Image src={banner.image_url} alt="" fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
                </div>
              )}
            </div>
          </Link>
        ) : (
          <>
            <p className="text-sm font-medium text-ink-muted">
              Projects · Jobs · Placement Prep · Resume · Custom Projects
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight text-ink sm:text-4xl">
              Everything a student needs for a career, in one place.
            </h1>
            <p className="mt-4 max-w-xl text-ink-muted">
              Buy or sell final-year projects, apply to jobs and internships, prepare for placements, build a resume, and
              get a custom project built — all on one account, shared with the CampusEduX app.
            </p>
          </>
        )}

        <div className="mt-6 max-w-xl">
          <SearchBar action="/projects" placeholder="Search projects…" />
        </div>
      </header>

      <OffersStrip offers={offers} />

      <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <PremiumPromo />
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <SectionHeader title="Browse by category" viewAllHref="/projects" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {categories.map((c, i) => {
              const v = categoryVisual(i);
              return (
                <CategoryCard
                  key={c.id}
                  href={`/projects/category/${c.id}`}
                  label={c.name}
                  count={c.project_count}
                  icon={categoryIcon(c.icon ?? c.name)}
                  tint={v.tint}
                  bg={v.bg}
                />
              );
            })}
          </div>
        </section>
      )}

      {trending.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <SectionHeader title="Trending projects" viewAllHref="/projects/trending" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {trending.map((p, i) => (
              <ProjectCard key={p.id} project={p} rank={i < 3 ? i + 1 : undefined} />
            ))}
          </div>
        </section>
      )}

      {jobs.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <SectionHeader title="Latest jobs" viewAllHref="/jobs" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        </section>
      )}

      <HomeLearning />

      {/* Static module overview — links into the dynamic sections above/below. */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/placement", title: "Placement Prep", body: "Aptitude, DSA, HR and company-wise practice." },
            { href: "/resume", title: "Resume Builder", body: "Guided sections, ATS scoring, PDF export." },
            { href: "/custom-projects", title: "Custom Projects", body: "Describe what you need — get it built and delivered." },
            { href: "/referral", title: "Referral Program", body: "Invite a friend, earn wallet credit." },
          ].map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="rounded-2xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-lg"
            >
              <div className="font-bold text-ink">{m.title}</div>
              <p className="mt-1.5 text-sm text-ink-muted">{m.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <SectionHeader title="What students say" />
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.id} className="rounded-2xl border border-line bg-white p-5 shadow-card">
                {t.rating > 0 && <Rating value={t.rating} showCount={false} />}
                <blockquote className="mt-2 text-sm text-ink-muted">“{t.quote}”</blockquote>
                <figcaption className="mt-3 text-sm font-semibold text-ink">
                  — {t.author_name}
                  {t.author_role ? <span className="font-normal text-ink-muted">, {t.author_role}</span> : null}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <SectionHeader title="Frequently asked questions" viewAllHref="/faq" viewAllLabel="All FAQs" />
          <div className="divide-y divide-line border-y border-line">
            {faqs.map((f) => (
              <details key={f.id} className="py-4">
                <summary className="cursor-pointer list-none font-semibold text-ink">{f.question}</summary>
                <p className="mt-2 text-sm text-ink-muted">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
