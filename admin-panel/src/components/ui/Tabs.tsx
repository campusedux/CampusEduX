import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Search-param-driven tab strip (keeps pages server-rendered). `param` is the
 * query key, `tabs` are `{ value, label }`, `current` is the active value.
 */
export function Tabs({
  basePath,
  param = 'tab',
  current,
  tabs,
}: {
  basePath: string;
  param?: string;
  current: string;
  tabs: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border">
      {tabs.map((t) => {
        const active = t.value === current;
        return (
          <Link
            key={t.value}
            href={`${basePath}?${param}=${t.value}`}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              active
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:border-border hover:text-ink',
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
