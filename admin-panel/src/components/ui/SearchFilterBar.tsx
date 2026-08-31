'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The search box + "Filters" button row that sits under every list page's
 * header. Submitting writes `?q=` (and resets `?page=`) and lets the server
 * component re-query. `filters` is an optional slot for the extra <select>s a
 * page needs; they should be plain controlled inputs that call `setParam`.
 */
export function SearchFilterBar({
  placeholder = 'Search…',
  filters,
  right,
}: {
  placeholder?: string;
  filters?: ReactNode;
  right?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get('q') ?? '');
  const [showFilters, setShowFilters] = useState(
    () => [...params.keys()].some((k) => k !== 'q' && k !== 'page'),
  );
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const push = useCallback(
    (next: string) => {
      const current = params.get('q') ?? '';
      if (next === current) return;
      const sp = new URLSearchParams(params.toString());
      if (next) sp.set('q', next);
      else sp.delete('q');
      sp.delete('page');
      startTransition(() => router.push(`${pathname}?${sp.toString()}`));
    },
    [params, pathname, router],
  );

  // Debounced search-as-you-type — one navigation ~400 ms after typing stops,
  // instead of one per keystroke.
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => push(value.trim()), 400);
    return () => clearTimeout(timer.current);
  }, [value, push]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    clearTimeout(timer.current);
    push(value.trim());
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={submit} className="relative flex-1 min-w-[240px]">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className={cn(
              'h-10 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint',
              'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light',
              pending && 'opacity-70',
            )}
          />
        </form>
        {filters ? (
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-ink',
              showFilters ? 'bg-brand-light text-brand-dark' : 'bg-white hover:bg-surface-subtle',
            )}
          >
            <SlidersHorizontal size={15} />
            Filters
          </button>
        ) : null}
        {right}
      </div>
      {filters && showFilters ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-white p-3">{filters}</div>
      ) : null}
    </div>
  );
}

/** Small helper for a single filter <select> that pushes its value into the URL. */
export function FilterSelect({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const sp = new URLSearchParams(params.toString());
    if (e.target.value) sp.set(name, e.target.value);
    else sp.delete(name);
    sp.delete('page');
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  }

  return (
    <label className="flex items-center gap-2 text-sm text-ink-muted">
      {label}
      <select
        defaultValue={params.get(name) ?? ''}
        onChange={onChange}
        className={cn(
          'h-9 rounded-lg border border-border bg-white px-2 text-sm text-ink',
          'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light',
          pending && 'opacity-70',
        )}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
