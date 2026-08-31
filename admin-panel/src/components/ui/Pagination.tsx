import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * "Showing 1 to X of Y" + prev/next, driven entirely by a `?page=` search
 * param so the list pages stay server-rendered and every query is a real
 * `.range()` against Supabase (never "load everything and slice").
 */
export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  searchParams = {},
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (v) sp.set(k, v);
    sp.set('page', String(p));
    return `${basePath}?${sp.toString()}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-1 pt-3 text-sm text-ink-muted">
      <span>
        Showing <span className="font-medium text-ink">{from}</span> to{' '}
        <span className="font-medium text-ink">{to}</span> of <span className="font-medium text-ink">{total}</span>
      </span>
      <div className="flex items-center gap-1">
        <PageLink href={href(page - 1)} disabled={page <= 1}>
          Previous
        </PageLink>
        <span className="px-2 text-xs text-ink-faint">
          Page {page} / {totalPages}
        </span>
        <PageLink href={href(page + 1)} disabled={page >= totalPages}>
          Next
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  const cls = 'rounded-lg border border-border px-3 py-1.5 text-sm font-medium';
  if (disabled) return <span className={cn(cls, 'cursor-not-allowed text-ink-faint opacity-60')}>{children}</span>;
  return (
    <Link href={href} className={cn(cls, 'text-ink hover:bg-surface-subtle')}>
      {children}
    </Link>
  );
}
