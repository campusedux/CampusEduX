import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pctChange } from '@/lib/utils';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info';

const TONE_CLASS: Record<Tone, string> = {
  brand: 'bg-brand-light text-brand-dark',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-[#B77A1B]',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
};

/**
 * Rounded white stat card: label, big number, small coloured %-change badge
 * ("▲12.5% vs last month"). Pass either a ready-made `change` or a
 * `current`/`previous` pair and it computes the delta.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  hint,
  current,
  previous,
  changeSuffix = 'vs last month',
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: Tone;
  hint?: string;
  current?: number;
  previous?: number;
  changeSuffix?: string;
}) {
  const change =
    current !== undefined && previous !== undefined ? pctChange(current, previous) : null;

  return (
    <div className="rounded-card border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        {Icon ? (
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', TONE_CLASS[tone])}>
            <Icon size={16} />
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {change ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold',
              change.direction === 'up' && 'bg-success/10 text-success',
              change.direction === 'down' && 'bg-danger/10 text-danger',
              change.direction === 'flat' && 'bg-surface-subtle text-ink-muted',
            )}
          >
            {change.direction === 'up' ? '▲' : change.direction === 'down' ? '▼' : '■'} {change.value}%
          </span>
        ) : null}
        {change ? <span className="text-xs text-ink-faint">{changeSuffix}</span> : null}
        {!change && hint ? <span className="text-xs text-ink-faint">{hint}</span> : null}
      </div>
    </div>
  );
}
