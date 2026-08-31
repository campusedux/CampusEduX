'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const PRESETS = ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year', 'Custom'] as const;

function rangeFor(preset: string): { from: string; to: string } {
  const now = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const to = iso(now);
  const d = new Date(now);
  switch (preset) {
    case 'Today':
      return { from: to, to };
    case 'This Week': {
      d.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      return { from: iso(d), to };
    }
    case 'This Month':
      return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to };
    case 'This Quarter':
      return { from: iso(new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)), to };
    case 'This Year':
      return { from: iso(new Date(now.getFullYear(), 0, 1)), to };
    default:
      return { from: '', to: '' };
  }
}

export function PresetBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get('preset') ?? 'This Month';

  const pick = (preset: string) => {
    const sp = new URLSearchParams();
    sp.set('preset', preset);
    const { from, to } = rangeFor(preset);
    if (from) sp.set('from', from);
    if (to) sp.set('to', to);
    router.push(`${pathname}?${sp.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {PRESETS.map((p) => (
        <button
          key={p}
          onClick={() => pick(p)}
          className={cn(
            'rounded-lg border px-3 py-1.5 text-sm font-medium',
            active === p ? 'border-brand bg-brand-light text-brand-dark' : 'border-border bg-white text-ink hover:bg-surface-subtle',
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
