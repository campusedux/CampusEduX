import { getPublicSupabase } from "@/lib/supabase/server";
import Link from "next/link";

export const revalidate = 300;
export const metadata = { title: "Placement Preparation" };

const TRACKS = [
  { slug: "aptitude", name: "Aptitude", desc: "Quantitative, logical reasoning and verbal ability practice sets." },
  { slug: "dsa", name: "DSA & Algorithms", desc: "Data structures and algorithm questions, tracked topic by topic." },
  { slug: "hr", name: "HR Questions", desc: "Common HR and behavioural interview questions with guidance." },
  { slug: "companies", name: "Company-wise Prep", desc: "Practice sets and questions organised by hiring company." },
];

export default async function PlacementPage() {
  const supabase = getPublicSupabase();
  let companies: any[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("companies")
      .select("id,name,logo_url")
      .order("open_jobs_count", { ascending: false })
      .limit(12);
    companies = data ?? [];
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <h1 className="font-serif text-3xl text-navy">Placement Preparation</h1>
      <p className="mt-2 max-w-2xl text-slate">
        Aptitude, DSA, HR and company-specific practice — with a real completion percentage, not a vague estimate. Practice, mock tests and live tests run inside the app, tied to your account and progress.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {TRACKS.map((t) => (
          <div key={t.slug} className="border border-navy/10 bg-white p-5">
            <h2 className="font-serif text-lg text-navy">{t.name}</h2>
            <p className="mt-2 text-sm text-slate">{t.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 font-serif text-xl text-navy">Prepare for specific companies</h2>
      {companies.length === 0 ? (
        <div className="empty-state mt-4">Company-wise preparation content will appear here once published.</div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          {companies.map((c) => (
            <Link key={c.id} href={`/jobs/companies/${c.id}`} className="border border-navy/10 bg-white px-4 py-2 text-sm text-navy hover:border-navy/30">
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <p className="mt-10 text-xs text-slate">Mock tests, live tests and your saved progress are personal to your account and are available inside the CampusEduX app.</p>
    </div>
  );
}
