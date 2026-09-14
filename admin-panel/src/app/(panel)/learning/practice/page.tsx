import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { DIFFICULTIES } from '@/lib/learning/constants';
import { listPracticeProblems, LEARNING_PAGE_SIZE } from '@/lib/learning/queries';
import { PracticeProblemsTable } from './PracticeProblemsTable';
import { PracticeCategoryManager } from './PracticeCategoryManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Coding Practice · CampusEduX Admin' };

type SP = { page?: string; q?: string; difficulty?: string; category?: string; status?: string };

export default async function PracticePage({ searchParams }: { searchParams: SP }) {
  const admin = await requireModule('learning');
  const page = Math.max(1, Number(searchParams.page ?? '1') || 1);

  const { rows, total, categories } = await listPracticeProblems({
    page,
    q: searchParams.q?.trim(),
    difficulty: searchParams.difficulty,
    category: searchParams.category,
    status: searchParams.status,
  });

  const active = {
    q: searchParams.q,
    difficulty: searchParams.difficulty,
    category: searchParams.category,
    status: searchParams.status,
  };
  const hasFilter = Object.values(active).some(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/learning" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Learning
        </Link>
        <PageHeader
          title="Coding Practice"
          subtitle="The global Practice → Coding Problems library (separate from Learning). Published problems appear at /practice/problems on the website."
          action={
            admin.perms.learning.add ? (
              <Link
                href="/learning/practice/new"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                <Plus size={16} /> New problem
              </Link>
            ) : null
          }
        />
      </div>

      <PracticeCategoryManager categories={categories} perms={admin.perms.learning} />

      <Card>
        <CardHeader title="Problems" description={`${total} problem${total === 1 ? '' : 's'} total.`} />
        <div className="space-y-4">
          <SearchFilterBar
            placeholder="Search problems by title…"
            filters={
              <>
                <FilterSelect
                  name="difficulty"
                  label="Difficulty"
                  options={DIFFICULTIES.map((d) => ({ value: d, label: d }))}
                />
                <FilterSelect
                  name="category"
                  label="Category"
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                />
                <FilterSelect
                  name="status"
                  label="Status"
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                    { value: 'archived', label: 'Archived' },
                  ]}
                />
              </>
            }
          />

          {categories.length === 0 ? (
            <EmptyState
              title="No practice categories yet"
              description="Apply migration 0072 / 044 and its seed (0073 / 045), or add a category above."
            />
          ) : rows.length === 0 ? (
            <EmptyState
              title={hasFilter ? 'No problems match this filter' : 'No problems yet'}
              description={hasFilter ? 'Clear the filters above.' : 'Create the first problem, or run the seed migrations.'}
            />
          ) : (
            <>
              <PracticeProblemsTable rows={rows} perms={admin.perms.learning} />
              <Pagination
                page={page}
                pageSize={LEARNING_PAGE_SIZE}
                total={total}
                basePath="/learning/practice"
                searchParams={active}
              />
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
