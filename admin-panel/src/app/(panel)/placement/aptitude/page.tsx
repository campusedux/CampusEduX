import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Card, Badge, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { RowActions } from '@/components/ui/RowActions';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { FlashToast } from '@/components/ui/FlashToast';
import { listAptitudeQuestions, getTestOptions, PLACEMENT_PAGE_SIZE } from '@/lib/placement/queries';
import { DIFFICULTIES } from '@/lib/placement/constants';
import { deleteTestQuestion } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Aptitude Questions · CampusEduX Admin' };

export default async function AptitudeQuestionsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; test?: string; difficulty?: string; created?: string; saved?: string };
}) {
  const admin = await requireModule('placement');
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? '').trim();
  const test = searchParams.test ?? '';
  const difficulty = searchParams.difficulty ?? '';

  const [{ rows, total, missing }, tests] = await Promise.all([
    listAptitudeQuestions({ page, q, test, difficulty }),
    getTestOptions(),
  ]);

  return (
    <div className="space-y-6">
      {searchParams.created ? <FlashToast title="Question created" /> : null}
      {searchParams.saved ? <FlashToast title="Question saved" /> : null}

      <PageHeader
        title="Aptitude Questions"
        subtitle="MCQ bank across aptitude, logical and verbal mock tests."
        action={
          admin.perms.placement.add ? (
            <Link href="/placement/questions/new?type=aptitude">
              <Button>
                <Plus size={16} /> Add Question
              </Button>
            </Link>
          ) : null
        }
      />

      <SearchFilterBar
        placeholder="Search question text…"
        filters={
          <>
            <FilterSelect name="test" label="Test" options={tests.map((t) => ({ value: t.id, label: t.title }))} />
            <FilterSelect name="difficulty" label="Difficulty" options={DIFFICULTIES.map((d) => ({ value: d, label: d }))} />
          </>
        }
      />

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No questions found" description={missing ? 'The test_questions table isn’t available yet.' : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Question</th>
                  <th className="pb-2 font-medium">Test</th>
                  <th className="pb-2 font-medium">Difficulty</th>
                  <th className="pb-2 font-medium">Marks</th>
                  <th className="pb-2 font-medium">Answer</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="max-w-md py-2.5">
                      <p className="truncate text-ink">{r.question_text}</p>
                    </td>
                    <td className="py-2.5 text-ink-muted">{r.test?.title || '—'}</td>
                    <td className="py-2.5">
                      <Badge label={r.difficulty} tone={r.difficulty === 'Hard' ? 'danger' : r.difficulty === 'Easy' ? 'success' : 'warning'} />
                    </td>
                    <td className="py-2.5 text-ink-muted">{r.marks}</td>
                    <td className="py-2.5 text-ink-muted">{(r.options ?? [])[r.correct_index] ?? `#${r.correct_index}`}</td>
                    <td className="py-2.5">
                      <RowActions
                        editHref={admin.perms.placement.edit ? `/placement/questions/aptitude/${r.id}/edit` : undefined}
                        deleteSlot={
                          admin.perms.placement.delete ? (
                            <DeleteButton action={deleteTestQuestion.bind(null, r.id, r.test?.id ?? '')} confirmMessage="Delete this question?" />
                          ) : null
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Pagination page={page} pageSize={PLACEMENT_PAGE_SIZE} total={total} basePath="/placement/aptitude" searchParams={{ q, test, difficulty }} />
        </div>
      </Card>
    </div>
  );
}
