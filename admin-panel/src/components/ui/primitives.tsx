import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-card border border-border bg-white p-5 shadow-sm', className)}>{children}</div>;
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_CLASS: Record<Tone, string> = {
  brand: 'bg-brand-light text-brand-dark',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-[#B77A1B]',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
  neutral: 'bg-surface-subtle text-ink-muted',
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', TONE_CLASS[tone])}>
      {label}
    </span>
  );
}

/**
 * Coloured status pill with the spec's fixed vocabulary:
 *   green  = Active / Success / Published / Approved / Completed / Hired / Paid
 *   red    = Inactive / Failed / Rejected / Blocked / Cancelled
 *   amber  = Pending / In Review / Upcoming / Draft
 *   blue   = Scheduled / Ongoing / Shortlisted / Processing
 */
const STATUS_TONE: Record<string, Tone> = {
  active: 'success',
  success: 'success',
  successful: 'success',
  published: 'success',
  approved: 'success',
  completed: 'success',
  hired: 'success',
  paid: 'success',
  live: 'success',
  resolved: 'success',
  inactive: 'danger',
  failed: 'danger',
  rejected: 'danger',
  blocked: 'danger',
  cancelled: 'danger',
  suspended: 'danger',
  removed: 'danger',
  expired: 'danger',
  pending: 'warning',
  in_review: 'warning',
  'in review': 'warning',
  upcoming: 'warning',
  draft: 'warning',
  requested: 'warning',
  scheduled: 'info',
  ongoing: 'info',
  shortlisted: 'info',
  processing: 'info',
  reviewed: 'info',
  reported: 'danger',
  // custom-project lifecycle
  in_development: 'info',
  testing: 'warning',
  ready: 'info',
  delivered: 'success',
};

export function StatusPill({ status }: { status: string | null | undefined }) {
  const key = String(status ?? 'unknown').toLowerCase();
  const tone = STATUS_TONE[key] ?? 'neutral';
  const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return <Badge label={label} tone={tone} />;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border py-16 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-ink placeholder:text-ink-faint',
        'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light',
        'disabled:cursor-not-allowed disabled:bg-surface-subtle',
        props.className,
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint',
        'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light',
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-ink',
        'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light',
        props.className,
      )}
    />
  );
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-danger">{children}</p>;
}

/** Thin section container used to group form fields under a header. */
export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      {children}
    </Card>
  );
}
