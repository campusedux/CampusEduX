import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Smartphone } from "lucide-react";
import { getPublicSupabase } from "@/lib/supabase/server";
import { SectionHeader, EmptyState, CompanyCard, type CompanyCardData } from "@/components/ui";
import { PLACEMENT_TRACKS } from "@/lib/placement";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Placement Preparation",
  description:
    "Aptitude, DSA, HR and company-wise placement preparation for CampusEduX students — topic catalogs, practice tests and study notes.",
};

const PLAY_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL;

const getPlacementData = cache(async () => {
  const supabase = getPublicSupabase();
  if (!supabase) {
    return {
      aptitude: [] as { id: string; name: string; category: string; total_questions: number }[],
      dsaTopics: [] as { id: string; name: string }[],
      dsaByTopic: {} as Record<string, number>,
      hrByCategory: [] as { category: string; count: number }[],
      tests: [] as { id: string; title: string; category: string; question_count: number; duration_minutes: number }[],
      companies: [] as CompanyCardData[],
      noteCount: 0,
    };
  }

  const [aptitude, dsaTopics, dsaProblems, hr, tests, companies, notes] = await Promise.all([
    supabase.from("aptitude_topics").select("id,name,category,total_questions").order("sort_order").limit(40),
    supabase.from("dsa_topics").select("id,name").order("sort_order").limit(40),
    supabase.from("dsa_problems").select("topic_id"),
    supabase.from("hr_questions").select("category"),
    supabase
      .from("practice_tests")
      .select("id,title,category,question_count,duration_minutes")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("companies").select("id,name,logo_url,open_jobs_count").order("name").limit(12),
    supabase.from("prep_notes").select("id", { count: "exact", head: true }).eq("is_published", true),
  ]);

  const dsaByTopic: Record<string, number> = {};
  for (const p of (dsaProblems.data ?? []) as { topic_id: string }[]) {
    dsaByTopic[p.topic_id] = (dsaByTopic[p.topic_id] ?? 0) + 1;
  }
  const hrCounts = new Map<string, number>();
  for (const r of (hr.data ?? []) as { category: string }[]) {
    hrCounts.set(r.category, (hrCounts.get(r.category) ?? 0) + 1);
  }

  return {
    aptitude: (aptitude.data ?? []) as { id: string; name: string; category: string; total_questions: number }[],
    dsaTopics: (dsaTopics.data ?? []) as { id: string; name: string }[],
    dsaByTopic,
    hrByCategory: [...hrCounts.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
    tests: (tests.data ?? []) as { id: string; title: string; category: string; question_count: number; duration_minutes: number }[],
    companies: (companies.data ?? []) as CompanyCardData[],
    noteCount: notes.count ?? 0,
  };
});

export default async function PlacementPage() {
  const { aptitude, dsaTopics, dsaByTopic, hrByCategory, tests, companies, noteCount } = await getPlacementData();

  const trackCount: Record<string, number> = {
    aptitude: aptitude.length,
    dsa: dsaTopics.length,
    hr: hrByCategory.reduce((s, c) => s + c.count, 0),
    tests: tests.length,
    notes: noteCount,
    companies: companies.length,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-ink">Placement Preparation</h1>
      <p className="mt-2 max-w-2xl text-ink-muted">
        Aptitude, DSA, HR and company-specific preparation. Browse the material here; timed practice, mock tests, live
        tests and the DSA code editor run inside the CampusEduX app, tied to your account and progress.
      </p>

      {/* App boundary */}
      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-primary-100 bg-primary-50 p-5">
        <Smartphone className="h-8 w-8 flex-shrink-0 text-primary" aria-hidden />
        <div className="flex-1">
          <div className="font-semibold text-primary-900">Practice &amp; tests are in the app</div>
          <p className="text-sm text-primary-800">
            Attempting questions, scoring, progress tracking and live tests happen in the CampusEduX mobile app — the same
            account you use here.
          </p>
        </div>
        {PLAY_URL ? (
          <Link href={PLAY_URL} className="btn-primary h-10 px-4 text-sm">
            Get the app
          </Link>
        ) : null}
      </div>

      {/* Tracks */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLACEMENT_TRACKS.map((t) => {
          const Icon = t.icon;
          const count = trackCount[t.slug] ?? 0;
          const href = t.slug === "notes" ? "/placement/notes" : t.slug === "companies" ? "#companies" : `#${t.slug}`;
          return (
            <Link
              key={t.slug}
              href={href}
              className="rounded-2xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-lg"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: t.bg }}>
                <Icon className="h-5 w-5" style={{ color: t.tint }} aria-hidden />
              </span>
              <div className="mt-3 font-bold text-ink">{t.name}</div>
              <p className="mt-1 text-sm text-ink-muted">{t.description}</p>
              {count > 0 && <p className="mt-2 text-xs font-semibold text-primary">{count} available</p>}
            </Link>
          );
        })}
      </div>

      {/* Aptitude topics */}
      {aptitude.length > 0 && (
        <section id="aptitude" className="mt-14 scroll-mt-20">
          <SectionHeader title="Aptitude topics" viewAllHref="/placement/notes?category=Aptitude" viewAllLabel="Notes" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {aptitude.map((a) => (
              <div key={a.id} className="rounded-xl border border-line bg-white p-4 shadow-card">
                <div className="font-semibold text-ink">{a.name}</div>
                <div className="mt-0.5 text-xs text-ink-faint">
                  {a.category}
                  {a.total_questions > 0 ? ` · ${a.total_questions} questions` : ""}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DSA topics */}
      {dsaTopics.length > 0 && (
        <section id="dsa" className="mt-14 scroll-mt-20">
          <SectionHeader title="DSA topics" viewAllHref="/placement/notes?category=DSA" viewAllLabel="Notes" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dsaTopics.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-line bg-white p-4 shadow-card">
                <span className="font-semibold text-ink">{d.name}</span>
                <span className="text-xs text-ink-faint">{dsaByTopic[d.id] ?? 0} problems</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* HR categories */}
      {hrByCategory.length > 0 && (
        <section id="hr" className="mt-14 scroll-mt-20">
          <SectionHeader title="HR & interview questions" viewAllHref="/placement/notes?category=HR" viewAllLabel="Notes" />
          <div className="flex flex-wrap gap-2">
            {hrByCategory.map((h) => (
              <span key={h.category} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink shadow-card">
                {h.category} <span className="text-ink-faint">· {h.count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Practice tests */}
      {tests.length > 0 && (
        <section id="tests" className="mt-14 scroll-mt-20">
          <SectionHeader title="Practice tests" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tests.map((t) => (
              <div key={t.id} className="rounded-xl border border-line bg-white p-4 shadow-card">
                <div className="font-semibold text-ink">{t.title}</div>
                <div className="mt-0.5 text-xs text-ink-faint">
                  {t.category} · {t.question_count} questions{t.duration_minutes ? ` · ${t.duration_minutes} min` : ""}
                </div>
                <div className="mt-2 text-xs font-semibold text-primary">Attempt in the app</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Learning notes */}
      <section className="mt-14">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-6">
          <div>
            <div className="text-lg font-bold text-ink">Study notes</div>
            <p className="mt-1 text-sm text-ink-muted">
              {noteCount > 0
                ? `${noteCount} published note${noteCount === 1 ? "" : "s"} across aptitude, DSA, HR, coding and company prep.`
                : "Study notes will appear here as they are published from the admin panel."}
            </p>
          </div>
          <Link href="/placement/notes" className="btn-primary h-10 px-5 text-sm">
            Browse notes
          </Link>
        </div>
      </section>

      {/* Company prep */}
      <section id="companies" className="mt-14 scroll-mt-20">
        <SectionHeader title="Prepare for specific companies" viewAllHref="/jobs/companies" viewAllLabel="All companies" />
        {companies.length === 0 ? (
          <EmptyState title="No company prep content yet" subtitle="Company-wise practice sets appear here once published." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c) => (
              <CompanyCard key={c.id} company={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
