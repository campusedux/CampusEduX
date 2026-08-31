'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

/** Two date inputs that write `?from=` / `?to=` (ISO yyyy-mm-dd) and reset page. */
export function DateRangePicker({ fromKey = 'from', toKey = 'to' }: { fromKey?: string; toKey?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const set = (key: string, value: string) => {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    sp.delete('page');
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  };

  const cls =
    'h-9 rounded-lg border border-border bg-white px-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light';

  return (
    <div className={`flex flex-wrap items-center gap-2 text-sm text-ink-muted ${pending ? 'opacity-70' : ''}`}>
      <label className="flex items-center gap-2">
        From
        <input type="date" defaultValue={params.get(fromKey) ?? ''} onChange={(e) => set(fromKey, e.target.value)} className={cls} />
      </label>
      <label className="flex items-center gap-2">
        To
        <input type="date" defaultValue={params.get(toKey) ?? ''} onChange={(e) => set(toKey, e.target.value)} className={cls} />
      </label>
    </div>
  );
}
