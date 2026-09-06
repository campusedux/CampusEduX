'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Star, Globe, Smartphone, Lock } from 'lucide-react';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { StatusPill } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import type { LearningGrid } from '@/lib/learning/queries';
import { GRID_TYPE_LABEL, targetingSummary } from '@/lib/learning/constants';
import { learningGridUrl } from '@/lib/learning/site';
import { ReorderButtons, StatusSelect, PreviewLink } from './_components/shared';
import { reorderGrid, setGridField, deleteGrid } from './actions';

type Row = LearningGrid & { section_count: number; topic_count: number; content_count: number };
type Perms = { add: boolean; edit: boolean; delete: boolean };

export function GridTable({ rows, perms }: { rows: Row[]; perms: Perms }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-ink-faint">
            <th className="w-8 py-2" />
            <th className="py-2 pr-3">Grid</th>
            <th className="py-2 pr-3">Structure</th>
            <th className="py-2 pr-3">Publication</th>
            <th className="py-2 pr-3">Visibility</th>
            <th className="py-2 pr-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((g) => (
            <tr key={g.id} className="align-middle">
              <td className="py-2">
                {perms.edit ? <ReorderButtons onMove={(dir) => reorderGrid(g.id, dir)} /> : null}
              </td>
              <td className="py-2 pr-3">
                <div className="flex items-center gap-2">
                  {g.icon ? <span className="text-lg leading-none">{g.icon}</span> : null}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/learning/grids/${g.id}`} className="font-semibold text-ink hover:text-brand">
                        {g.name}
                      </Link>
                      {g.is_featured ? <Star size={13} className="text-warning" fill="currentColor" /> : null}
                      {g.is_premium ? <Lock size={12} className="text-[#B77A1B]" /> : null}
                    </div>
                    <p className="text-xs text-ink-faint">
                      /{g.slug} · <span className="text-ink-muted">{GRID_TYPE_LABEL[g.grid_type]}</span>
                      {g.target_type && g.target_type !== 'global' ? ` · ${targetingSummary(g)}` : ''}
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-2 pr-3 text-ink-muted">
                {g.section_count} section{g.section_count === 1 ? '' : 's'} · {g.topic_count} topic
                {g.topic_count === 1 ? '' : 's'} · {g.content_count} block{g.content_count === 1 ? '' : 's'}
              </td>
              <td className="py-2 pr-3">
                {perms.edit ? (
                  <StatusSelect value={g.status} onChange={(next) => setGridField(g.id, 'status', next)} />
                ) : (
                  <StatusPill status={g.status} />
                )}
              </td>
              <td className="py-2 pr-3">
                <div className="flex items-center gap-3">
                  <VisibilityToggle
                    label="Website"
                    icon={<Globe size={14} />}
                    on={g.show_on_website}
                    disabled={!perms.edit}
                    onToggle={(next) => setGridField(g.id, 'show_on_website', next)}
                  />
                  <VisibilityToggle
                    label="Mobile"
                    icon={<Smartphone size={14} />}
                    on={g.show_on_mobile}
                    disabled={!perms.edit}
                    onToggle={(next) => setGridField(g.id, 'show_on_mobile', next)}
                  />
                </div>
              </td>
              <td className="py-2 pr-1">
                <div className="flex items-center justify-end gap-1">
                  {g.status === 'published' && g.show_on_website ? (
                    <PreviewLink href={learningGridUrl(g.slug)} />
                  ) : null}
                  <Link
                    href={`/learning/grids/${g.id}`}
                    aria-label="Edit"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-surface-subtle hover:text-ink"
                  >
                    <Pencil size={15} />
                  </Link>
                  {perms.delete ? (
                    <DeleteButton
                      action={() => deleteGrid(g.id)}
                      confirmMessage={`Delete grid "${g.name}"? It must have no sections. This cannot be undone — consider Archiving instead.`}
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

export function VisibilityToggle({
  label,
  icon,
  on,
  disabled,
  onToggle,
}: {
  label: string;
  icon: React.ReactNode;
  on: boolean;
  disabled?: boolean;
  onToggle: (next: boolean) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() =>
        start(async () => {
          const res = await onToggle(!on);
          if (!res?.ok) toast({ title: 'Update failed', description: res?.error, variant: 'error' });
          else router.refresh();
        })
      }
      title={`${label}: ${on ? 'visible' : 'hidden'}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-60',
        on ? 'border-success/30 bg-success/10 text-success' : 'border-border bg-white text-ink-faint',
        pending && 'opacity-70',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
