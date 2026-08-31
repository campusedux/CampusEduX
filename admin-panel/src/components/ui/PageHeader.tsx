import type { ReactNode } from 'react';

/**
 * The standard page template header: bold large title + one-line gray subtitle
 * on the left, a primary action (usually "+ Add …") on the right.
 */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex flex-shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}
