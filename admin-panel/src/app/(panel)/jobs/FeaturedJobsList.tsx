'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Badge } from '@/components/ui/primitives';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { useToast } from '@/components/ui/toast';
import { toggleJobFeatured, setJobPriority } from './actions';

interface Row {
  id: string;
  title: string;
  company_name: string | null;
  on: boolean;
  priority: number;
}

export function FeaturedJobsList({ rows, canEdit }: { rows: Row[]; canEdit: boolean }) {
  return (
    <Card>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink-muted">
            <th className="pb-2 font-medium">Job</th>
            <th className="pb-2 font-medium">Company</th>
            <th className="pb-2 font-medium">Featured</th>
            <th className="pb-2 font-medium">Priority</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border odd:bg-surface-subtle/40">
              <td className="py-2.5 font-medium text-ink">{r.title}</td>
              <td className="py-2.5 text-ink-muted">{r.company_name || '—'}</td>
              <td className="py-2.5">
                {canEdit ? (
                  <ToggleSwitch checked={r.on} action={toggleJobFeatured.bind(null, r.id)} />
                ) : (
                  <Badge label={r.on ? 'Yes' : 'No'} tone={r.on ? 'info' : 'neutral'} />
                )}
              </td>
              <td className="py-2.5">
                <PriorityInput id={r.id} value={r.priority} disabled={!canEdit || !r.on} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function PriorityInput({ id, value, disabled }: { id: string; value: number; disabled?: boolean }) {
  const [v, setV] = useState(value);
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const save = () => {
    if (v === value) return;
    start(async () => {
      const res = await setJobPriority(id, Number(v) || 0);
      if (!res.ok) toast({ title: 'Could not save priority', description: res.error, variant: 'error' });
      router.refresh();
    });
  };

  return (
    <input
      type="number"
      value={v}
      disabled={disabled || pending}
      onChange={(e) => setV(Number(e.target.value))}
      onBlur={save}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      className="h-8 w-16 rounded-lg border border-border bg-white px-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light disabled:bg-surface-subtle"
    />
  );
}
