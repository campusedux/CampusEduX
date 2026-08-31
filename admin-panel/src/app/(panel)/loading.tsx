import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Route-level fallback. Next wraps every panel page in <Suspense> with this, so
 * navigating shows the shell + a skeleton immediately instead of blocking on
 * the server component's data fetch. Real content streams in when ready.
 */
export default function PanelLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card border border-border bg-white p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-24" />
          </div>
        ))}
      </div>

      <div className="rounded-card border border-border bg-white p-5">
        <Skeleton className="h-4 w-40" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full opacity-70" />
          ))}
        </div>
      </div>
    </div>
  );
}
