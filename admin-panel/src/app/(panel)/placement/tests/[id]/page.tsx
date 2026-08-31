import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Pencil, Plus, BarChart3 } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { safe } from '@/lib/utils';
import { getMockTest } from '@/lib/placement/queries';
import { Card, CardHeader, Badge, EmptyState } from '@/components/ui/primitives';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { FlashToast } from '@/components/ui/FlashToast';
import { deleteMockTest } from '../../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mock Test · CampusEduX Admin' };

export default async function MockTestDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string; saved?: string };
}) {
  const admin = await requireModule('placement');
  const test = await getMockTest(params.id);
  if (!test) notFound();
  const supabase = createClient();
  const questions = await safe(
    supabase
      .from('test_questions')
      .select('id, question_text, difficulty, marks, correct_index, options')
      .eq('test_id', params.id)
      .order('sort_order'),
    [] as any[],
  );

  return (
    <div className="space-y-5">
      {searchParams.created ? <FlashToast title="Mock test created" /> : null}
      {searchParams.saved ? <FlashToast title="Changes saved" /> : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/placement/tests" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
            <ArrowLeft size={14} /> Mock Tests
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-ink">{test.title}</h1>
            <Badge label={test.category} tone="neutral" />
            <Badge label={test.is_published ? 'Published' : 'Draft'} tone={test.is_published ? 'success' : 'warning'} />
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {test.duration_minutes} min · {test.total_marks || 0} marks · {test.difficulty} · {questions.length} questions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/placement/results/${test.id}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-sm font-medium text-ink hover:bg-surface-subtle"
          >
            <BarChart3 size={14} /> Results
          </Link>
          {admin.perms.placement.add ? (
            <Link
              href={`/placement/questions/new?type=aptitude`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-sm font-medium text-ink hover:bg-surface-subtle"
            >
              <Plus size={14} /> Add question
            </Link>
          ) : null}
          {admin.perms.placement.edit ? (
            <Link
              href={`/placement/tests/${test.id}/edit`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-sm font-medium text-ink hover:bg-surface-subtle"
            >
              <Pencil size={14} /> Edit
            </Link>
          ) : null}
          {admin.perms.placement.delete ? (
            <DeleteButton action={deleteMockTest.bind(null, test.id)} confirmMessage={`Delete "${test.title}"?`} label="Delete" redirectTo="/placement/tests" />
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader title={`Questions (${questions.length})`} />
        {questions.length === 0 ? (
          <EmptyState title="No questions yet" description="Add questions from the Aptitude Questions screen and pick this test." />
        ) : (
          <ol className="space-y-2">
            {questions.map((q: any, i: number) => (
              <li key={q.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-ink">
                    <span className="mr-2 text-ink-faint">{i + 1}.</span>
                    {q.question_text}
                  </p>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <Badge label={q.difficulty} tone={q.difficulty === 'Hard' ? 'danger' : q.difficulty === 'Easy' ? 'success' : 'warning'} />
                    {admin.perms.placement.edit ? (
                      <Link href={`/placement/questions/aptitude/${q.id}/edit`} className="text-brand hover:underline">
                        Edit
                      </Link>
                    ) : null}
                  </div>
                </div>
                <p className="mt-1 text-xs text-ink-faint">
                  Answer: {(q.options ?? [])[q.correct_index] ?? `#${q.correct_index}`} · {q.marks} mark{q.marks === 1 ? '' : 's'}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
