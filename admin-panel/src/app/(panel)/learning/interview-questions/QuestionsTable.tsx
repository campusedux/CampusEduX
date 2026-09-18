'use client';

import Link from 'next/link';
import { StatusPill } from '@/components/ui/primitives';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { ReorderButtons, StatusSelect, PreviewLink } from '@/app/(panel)/learning/_components/shared';
import type { InterviewQuestionRow } from '@/lib/learning/queries';
import {
  deleteInterviewQuestion,
  setInterviewQuestionField,
} from '@/app/(panel)/learning/interview-questions-global-actions';
import { reorderInterviewQuestion } from '@/app/(panel)/learning/interview-questions-actions';

type Perms = { add: boolean; edit: boolean; delete: boolean };

export function QuestionsTable({ rows, perms }: { rows: InterviewQuestionRow[]; perms: Perms }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-faint">
            <th className="px-3 py-2.5" />
            <th className="px-3 py-2.5 font-semibold">Question</th>
            <th className="px-3 py-2.5 font-semibold">Topic</th>
            <th className="px-3 py-2.5 font-semibold">Difficulty</th>
            <th className="px-3 py-2.5 font-semibold">Status</th>
            <th className="px-3 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((q) => (
            <tr key={q.id} className="hover:bg-surface-subtle/60">
              <td className="px-3 py-2.5">
                {perms.edit ? <ReorderButtons onMove={(dir) => reorderInterviewQuestion(q.id, q.topic_id, dir)} /> : null}
              </td>
              <td className="px-3 py-2.5">
                <Link href={`/learning/interview-questions/${q.id}`} className="font-medium text-ink hover:text-brand line-clamp-2">
                  {q.question}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-ink-muted">
                {q.category_name ? `${q.category_name} · ` : ''}
                {q.topic_name ?? '—'}
              </td>
              <td className="px-3 py-2.5 text-ink-muted">{q.difficulty}</td>
              <td className="px-3 py-2.5">
                {perms.edit ? (
                  <StatusSelect value={q.status} onChange={(v) => setInterviewQuestionField(q.id, 'status', v)} />
                ) : (
                  <StatusPill status={q.status} />
                )}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center justify-end gap-2">
                  {q.category_slug && q.topic_slug ? (
                    <PreviewLink href={`/practice/interview-questions/${q.category_slug}/${q.topic_slug}`} />
                  ) : null}
                  {perms.edit ? (
                    <Link
                      href={`/learning/interview-questions/${q.id}`}
                      className="inline-flex h-8 items-center rounded-lg border border-border px-2.5 text-xs font-medium text-ink hover:bg-surface-subtle"
                    >
                      Edit
                    </Link>
                  ) : null}
                  {perms.delete ? (
                    <DeleteButton
                      action={() => deleteInterviewQuestion(q.id)}
                      confirmMessage={`Delete this question? This cannot be undone.`}
                    />
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default QuestionsTable;
