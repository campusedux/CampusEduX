import Link from 'next/link';
import { Plus, LayoutGrid, FolderTree, FileText, BookOpen, Code2, ArrowRight } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { formatNumber } from '@/lib/utils';
import { getAcademicOptions } from '@/lib/academic-targeting';
import { getLearningDashboard, listLearningGrids, LEARNING_PAGE_SIZE } from '@/lib/learning/queries';
import { GRID_TYPES, GRID_TYPE_LABEL } from '@/lib/learning/constants';
import { GridTable } from './GridTable';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Learning · CampusEduX Admin' };

type SP = { page?: string; q?: string; status?: string; type?: string; premium?: string; course?: string };

export default async function LearningDashboard({ searchParams }: { searchParams: SP }) {
  const admin = await requireModule('learning');
  const page = Math.max(1, Number(searchParams.page ?? '1') || 1);
  const [d, grids, options] = await Promise.all([
    getLearningDashboard(),
    listLearningGrids({
      page,
      q: searchParams.q?.trim(),
      status: searchParams.status,
      type: searchParams.type,
      premium: searchParams.premium,
      course: searchParams.course,
    }),
    getAcademicOptions(),
  ]);

  const active = { q: searchParams.q, status: searchParams.status, type: searchParams.type, premium: searchParams.premium, course: searchParams.course };
  const hasFilter = Object.values(active).some(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning"
        subtitle="The single learning CMS — Grids → (Sections) → Topics → Content. Published items appear on the Website and Mobile app automatically."
        action={
          admin.perms.learning.add ? (
            <Link
              href="/learning/grids/new"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              <Plus size={16} /> New grid
            </Link>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Grids" value={formatNumber(d.grids)} icon={LayoutGrid} hint={`${d.publishedGrids} published · ${d.draftGrids} draft · ${d.archivedGrids} archived`} />
        <StatCard label="Sections" value={formatNumber(d.sections)} icon={FolderTree} tone="info" />
        <StatCard label="Topics" value={formatNumber(d.topics)} icon={BookOpen} tone="brand" hint={`${d.premiumTopics} premium`} />
        <StatCard label="Content blocks" value={formatNumber(d.contents)} icon={FileText} tone="success" hint={`${d.publishedContents} published · ${d.draftContents} draft`} />
      </div>

      <Link
        href="/learning/practice"
        className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white p-4 transition-colors hover:border-brand/40 hover:bg-surface-subtle"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Code2 size={18} />
          </span>
          <div>
            <div className="font-semibold text-ink">Coding Practice</div>
            <div className="text-sm text-ink-muted">
              The global Practice → Coding Problems library (separate from the grids below).
            </div>
          </div>
        </div>
        <ArrowRight size={18} className="flex-shrink-0 text-ink-faint" />
      </Link>

      <Card>
        <CardHeader
          title="Learning grids"
          description="Each grid is one learning area. Open a grid to manage its sections, topics and content."
        />
        <div className="space-y-4">
          <SearchFilterBar
            placeholder="Search grids by name…"
            filters={
              <>
                <FilterSelect
                  name="status"
                  label="Status"
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                    { value: 'archived', label: 'Archived' },
                  ]}
                />
                <FilterSelect
                  name="type"
                  label="Type"
                  options={GRID_TYPES.map((t) => ({ value: t, label: GRID_TYPE_LABEL[t] }))}
                />
                <FilterSelect
                  name="premium"
                  label="Access"
                  options={[
                    { value: 'yes', label: 'Premium' },
                    { value: 'no', label: 'Free' },
                  ]}
                />
                <FilterSelect
                  name="course"
                  label="Course"
                  options={options.courses.map((c) => ({ value: c.id, label: c.name }))}
                />
              </>
            }
          />

          {grids.missing ? (
            <EmptyState
              title="Learning tables not found"
              description="Apply admin migrations 019 → 021 → 022 (or mobile 0042 → 0044 → 0045) in Supabase, then reload."
            />
          ) : grids.rows.length === 0 ? (
            <EmptyState
              title={hasFilter ? 'No grids match this filter' : 'No learning grids yet'}
              description={
                hasFilter
                  ? 'Clear the filters above.'
                  : 'Create your first grid — for example “Communication Skills” — then add Topics and Content.'
              }
              action={
                admin.perms.learning.add && !hasFilter ? (
                  <Link href="/learning/grids/new" className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-dark">
                    <Plus size={15} /> New grid
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <>
              <GridTable rows={grids.rows} perms={admin.perms.learning} />
              <Pagination
                page={page}
                pageSize={LEARNING_PAGE_SIZE}
                total={grids.total}
                basePath="/learning"
                searchParams={active}
              />
            </>
          )}
        </div>
      </Card>

      {d.recentlyUpdated.length > 0 ? (
        <Card>
          <CardHeader title="Recently updated content" description="The last content blocks edited across every grid." />
          <ul className="divide-y divide-border text-sm">
            {d.recentlyUpdated.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                <span className="truncate text-ink">{c.title || c.heading || 'Untitled block'}</span>
                <span className="flex flex-shrink-0 items-center gap-3 text-xs text-ink-faint">
                  <span className={c.status === 'published' ? 'text-success' : ''}>{c.status}</span>
                  <time>{new Date(c.updated_at).toLocaleDateString()}</time>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
