import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Card, Badge, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { RowActions } from '@/components/ui/RowActions';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { FlashToast } from '@/components/ui/FlashToast';
import { listHrQuestions, PLACEMENT_PAGE_SIZE } from '@/lib/placement/queries';
import { HR_CATEGORIES } from '@/lib/placement/constants';
import { deleteHrQuestion } from './actions';

export async function HrQuestionList({
  scope,
  title,
  subtitle,
  basePath,
  searchParams,
  perms,
  companies = [],
}: {
  scope: 'generic' | 'company';
  title: string;
  subtitle: string;
  basePath: string;
  searchParams: { page?: string; q?: string; company?: string; category?: string; created?: string; saved?: string };
  perms: { add: boolean; edit: boolean; delete: boolean };
  companies?: { id: string; name: string }[];
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? '').trim();
  const company = searchParams.company ?? '';
  const { rows, total, missing } = await listHrQuestions({ page, q, company, scope });

  return (
    <div className="space-y-6">
      {searchParams.created ? <FlashToast title="Question created" /> : null}
      {searchParams.saved ? <FlashToast title="Question saved" /> : null}

      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          perms.add ? (
            <Link href={`/placement/questions/new?type=hr${scope === 'company' ? '&scope=company' : ''}`}>
              <Button>
                <Plus size={16} /> Add Question
              </Button>
            </Link>
          ) : null
        }
      />

      <SearchFilterBar
        placeholder="Search question…"
        filters={
          scope === 'company' && companies.length ? (
            <FilterSelect name="company" label="Company" options={companies.map((c) => ({ value: c.id, label: c.name }))} />
          ) : undefined
        }
      />

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No questions found" description={missing ? 'The hr_questions table isn’t available yet.' : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Question</th>
                  {scope === 'company' ? <th className="pb-2 font-medium">Company</th> : null}
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Difficulty</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="max-w-md py-2.5">
                      <p className="truncate text-ink">{r.question}</p>
                    </td>
                    {scope === 'company' ? <td className="py-2.5 text-ink-muted">{r.company?.name || '—'}</td> : null}
                    <td className="py-2.5 text-ink-muted">{r.category}</td>
                    <td className="py-2.5">
                      <Badge label={r.difficulty || 'Medium'} tone="neutral" />
                    </td>
                    <td className="py-2.5">
                      <RowActions
                        editHref={perms.edit ? `/placement/questions/hr/${r.id}/edit` : undefined}
                        deleteSlot={
                          perms.delete ? (
                            <DeleteButton action={deleteHrQuestion.bind(null, r.id, scope)} confirmMessage="Delete this question?" />
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
          <Pagination page={page} pageSize={PLACEMENT_PAGE_SIZE} total={total} basePath={basePath} searchParams={{ q, company }} />
        </div>
      </Card>
    </div>
  );
}

export { HR_CATEGORIES };
