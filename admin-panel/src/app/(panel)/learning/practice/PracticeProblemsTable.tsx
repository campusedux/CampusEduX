'use client';

import Link from 'next/link';
import { Badge, StatusPill } from '@/components/ui/primitives';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { StatusSelect, PreviewLink } from '@/app/(panel)/learning/_components/shared';
import type { PracticeProblemRow } from '@/lib/learning/queries';
import { deletePracticeProblem, setPracticeProblemField } from '@/app/(panel)/learning/practice-global-actions';

type Perms = { add: boolean; edit: boolean; delete: boolean };

export function PracticeProblemsTable({ rows, perms }: { rows: PracticeProblemRow[]; perms: Perms }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-faint">
            <th className="px-3 py-2.5 font-semibold">Problem</th>
            <th className="px-3 py-2.5 font-semibold">Category</th>
            <th className="px-3 py-2.5 font-semibold">Difficulty</th>
            <th className="px-3 py-2.5 font-semibold">Status</th>
            <th className="px-3 py-2.5 font-semibold">Premium</th>
            <th className="px-3 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((p) => (
            <tr key={p.id} className="hover:bg-surface-subtle/60">
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Link href={`/learning/practice/${p.id}`} className="font-medium text-ink hover:text-brand">
                    {p.title}
                  </Link>
                </div>
                <div className="text-xs text-ink-faint">/practice/problems/{p.slug ?? '—'}</div>
              </td>
              <td className="px-3 py-2.5 text-ink-muted">{p.category_name ?? '—'}</td>
              <td className="px-3 py-2.5 text-ink-muted">{p.difficulty}</td>
              <td className="px-3 py-2.5">
                {perms.edit ? (
                  <StatusSelect value={p.status} onChange={(v) => setPracticeProblemField(p.id, 'status', v)} />
                ) : (
                  <StatusPill status={p.status} />
                )}
              </td>
              <td className="px-3 py-2.5">
                {perms.edit ? (
                  <label className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                    <input
                      type="checkbox"
                      defaultChecked={p.is_premium}
                      onChange={(e) => setPracticeProblemField(p.id, 'is_premium', e.target.checked)}
                      className="h-4 w-4 rounded border-border text-brand"
                    />
                    Premium
                  </label>
                ) : p.is_premium ? (
                  <Badge label="Premium" tone="warning" />
                ) : (
                  <span className="text-xs text-ink-faint">—</span>
                )}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center justify-end gap-2">
                  {p.slug ? <PreviewLink href={`/practice/problems/${p.slug}`} /> : null}
                  {perms.edit ? (
                    <Link
                      href={`/learning/practice/${p.id}`}
                      className="inline-flex h-8 items-center rounded-lg border border-border px-2.5 text-xs font-medium text-ink hover:bg-surface-subtle"
                    >
                      Edit
                    </Link>
                  ) : null}
                  {perms.delete ? (
                    <DeleteButton
                      action={() => deletePracticeProblem(p.id)}
                      confirmMessage={`Delete "${p.title}"? This cannot be undone.`}
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

export default PracticeProblemsTable;
