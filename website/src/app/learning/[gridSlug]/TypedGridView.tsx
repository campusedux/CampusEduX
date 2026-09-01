import Link from "next/link";
import { ChevronRight, Smartphone, Lock, Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { CompanyCard, type CompanyCardData } from "@/components/ui";
import { getGridDsaCatalog, getGridMockTests, getGridHrCatalog, getGridCompanies } from "@/lib/learning";
import type { LearningGridBrief } from "@/lib/learning.types";

const PLAY_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL;

/**
 * The grid page for a specialised grid (`grid_type` ∈ dsa · mock_test · hr ·
 * company). The catalog comes from the canonical practice tables (scoped by
 * `learning_grid_id`, migration 0044/021); the anon RLS policies (0045/022)
 * hide anything draft / premium / audience-targeted. Attempting / scoring /
 * running code stays in the CampusEduX app — this page links out.
 */
export async function TypedGridView({ grid }: { grid: LearningGridBrief }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-ink-faint">
        <Link href="/learning" className="hover:text-ink">
          Learning
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="text-ink-muted">{grid.name}</span>
      </nav>

      <h1 className="text-3xl font-bold text-ink">{grid.name}</h1>
      {grid.description ? <p className="mt-3 max-w-2xl text-ink-muted">{grid.description}</p> : null}

      {grid.grid_type !== "hr" ? (
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-primary-100 bg-primary-50 p-5">
          <Smartphone className="h-8 w-8 flex-shrink-0 text-primary" aria-hidden />
          <div className="flex-1">
            <div className="font-semibold text-primary-900">Practice &amp; scoring are in the app</div>
            <p className="text-sm text-primary-800">
              Solving problems, attempting tests, code execution and progress tracking happen in the CampusEduX mobile
              app — the same account you use here.
            </p>
          </div>
          {PLAY_URL ? (
            <Link href={PLAY_URL} className="btn-primary h-10 px-4 text-sm">
              Get the app
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8">
        {grid.grid_type === "dsa" ? <DsaCatalog gridId={grid.id} /> : null}
        {grid.grid_type === "mock_test" ? <MockCatalog gridId={grid.id} /> : null}
        {grid.grid_type === "hr" ? <HrCatalog gridId={grid.id} /> : null}
        {grid.grid_type === "company" ? <CompanyCatalog gridId={grid.id} /> : null}
      </div>
    </div>
  );
}

async function DsaCatalog({ gridId }: { gridId: string }) {
  const topics = await getGridDsaCatalog(gridId);
  if (topics.length === 0) {
    return <EmptyState title="No topics yet" subtitle="Coding topics for this grid appear here once published." />;
  }
  return (
    <>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
        {topics.length} topic{topics.length === 1 ? "" : "s"}
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {topics.map((t) => (
          <li key={t.id} className="rounded-xl border border-line bg-white p-4 shadow-card">
            <div className="font-semibold text-ink">{t.name}</div>
            <div className="mt-1 text-xs text-ink-faint">
              {t.problems} problem{t.problems === 1 ? "" : "s"}
              {t.byDifficulty.Easy ? ` · ${t.byDifficulty.Easy} easy` : ""}
              {t.byDifficulty.Medium ? ` · ${t.byDifficulty.Medium} medium` : ""}
              {t.byDifficulty.Hard ? ` · ${t.byDifficulty.Hard} hard` : ""}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

async function MockCatalog({ gridId }: { gridId: string }) {
  const tests = await getGridMockTests(gridId);
  if (tests.length === 0) {
    return <EmptyState title="No tests yet" subtitle="Mock tests for this grid appear here once published." />;
  }
  return (
    <>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
        {tests.length} test{tests.length === 1 ? "" : "s"}
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {tests.map((t) => (
          <li key={t.id} className="rounded-xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-ink">{t.title}</span>
              {t.is_premium ? <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" aria-hidden /> : null}
            </div>
            <div className="mt-1 text-xs text-ink-faint">
              {t.category} · {t.question_count} question{t.question_count === 1 ? "" : "s"}
              {t.duration_minutes ? ` · ${t.duration_minutes} min` : ""}
            </div>
            <div className="mt-2 text-xs font-semibold text-primary">Attempt in the app</div>
          </li>
        ))}
      </ul>
    </>
  );
}

async function HrCatalog({ gridId }: { gridId: string }) {
  const cats = await getGridHrCatalog(gridId);
  if (cats.length === 0) {
    return <EmptyState title="No questions yet" subtitle="HR interview questions for this grid appear here once published." />;
  }
  return (
    <>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
        {cats.reduce((n, c) => n + c.count, 0)} questions across {cats.length} categor{cats.length === 1 ? "y" : "ies"}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {cats.map((c) => (
          <span key={c.category} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink shadow-card">
            {c.category} <span className="text-ink-faint">· {c.count}</span>
          </span>
        ))}
      </div>
    </>
  );
}

async function CompanyCatalog({ gridId }: { gridId: string }) {
  const companies = await getGridCompanies(gridId);
  if (companies.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No companies yet"
        subtitle="Company-specific preparation appears here once published."
      />
    );
  }
  return (
    <>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
        {companies.length} compan{companies.length === 1 ? "y" : "ies"}
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((c) => (
          <div key={c.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <CompanyCard company={{ id: c.id, name: c.name, logo_url: c.logoUrl } as CompanyCardData} />
            {c.headline ? <p className="mt-2 text-xs text-ink-faint">{c.headline}</p> : null}
          </div>
        ))}
      </div>
    </>
  );
}

export default TypedGridView;
