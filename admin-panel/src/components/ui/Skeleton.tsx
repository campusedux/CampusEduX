import { cn } from '@/lib/utils';

/** Shimmering placeholder block. Compose these for route-level loading states. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-subtle', className)} />;
}

/** Fallback shown while a lazy chart chunk loads. */
export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: height }}>
      <div className="w-full space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-[160px] w-full" />
        <div className="flex gap-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

/** Generic list/table loading block. */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full opacity-70" />
      ))}
    </div>
  );
}

/** Row of stat-card placeholders. */
export function StatGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-card border border-border bg-white p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-7 w-24" />
        </div>
      ))}
    </div>
  );
}
