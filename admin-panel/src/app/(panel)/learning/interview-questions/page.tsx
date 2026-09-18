import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { DIFFICULTIES } from '@/lib/learning/constants';
import { listInterviewQuestions, LEARNING_PAGE_SIZE } from '@/lib/learning/queries';
import { QuestionsTable } from './QuestionsTable';
import { CategoryManager } from './CategoryManager';
import { TopicManager } from './TopicManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Interview Questions · CampusEduX Admin' };

type SP = { page?: string; q?: string; topic?: string; category?: string; difficulty?: string; status?: string };

export default async function InterviewQuestionsPage({ searchParams }: { searchParams: SP }) {
  const admin = await requireModule('learning');
  const page = Math.max(1, Number(searchParams.page ?? '1') || 1);

  const { rows, total, categories, topics } = await listInterviewQuestions({
    page,
    q: searchParams.q?.trim(),
    topic: searchParams.topic,
    category: searchParams.category,
    difficulty: searchParams.difficulty,
    status: searchParams.status,
  });

  const active = {
    q: searchParams.q,
    topic: searchParams.topic,
    category: searchParams.category,
    difficulty: searchParams.difficulty,
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
          title="Interview Questions"
          subtitle="Practice → Interview Questions — Category (language) → Topic → Question. Published questions appear at /practice/interview-questions on the website."
          action={
            admin.perms.learning.add ? (
              <Link
                href="/learning/interview-questions/new"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                <Plus size={16} /> New question
              </Link>
            ) : null
          }
        />
      </div>

      <CategoryManager categories={categories} perms={admin.perms.learning} />
      <TopicManager categories={categories} topics={topics} perms={admin.perms.learning} />

      <Card>
        <CardHeader title="Questions" description={`${total} question${total === 1 ? '' : 's'} total.`} />
        <div className="space-y-4">
          <SearchFilterBar
            placeholder="Search questions by text…"
            filters={
              <>
                <FilterSelect
                  name="category"
                  label="Category"
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                />
                <FilterSelect name="topic" label="Topic" options={topics.map((t) => ({ value: t.id, label: t.name }))} />
                <FilterSelect
                  name="difficulty"
                  label="Difficulty"
                  options={DIFFICULTIES.map((d) => ({ value: d, label: d }))}
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

          {topics.length === 0 ? (
            <EmptyState title="No topics yet" description="Add a category and topic above, or apply migration 0104 / 076." />
          ) : rows.length === 0 ? (
            <EmptyState
              title={hasFilter ? 'No questions match this filter' : 'No questions yet'}
              description={hasFilter ? 'Clear the filters above.' : 'Create the first question, or run the seed migrations.'}
            />
          ) : (
            <>
              <QuestionsTable rows={rows} perms={admin.perms.learning} />
              <Pagination
                page={page}
                pageSize={LEARNING_PAGE_SIZE}
                total={total}
                basePath="/learning/interview-questions"
                searchParams={active}
              />
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
