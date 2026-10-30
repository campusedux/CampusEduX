import { cn } from "@/lib/cn";

/** Shimmer block. Compose the presets below or use directly with a size class. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer motion-reduce:animate-none rounded-lg bg-[linear-gradient(90deg,rgb(var(--line)/0.55)_0%,rgb(var(--line)/0.95)_50%,rgb(var(--line)/0.55)_100%)] bg-[length:200%_100%]",
        className,
      )}
      aria-hidden
    />
  );
}

/** Matches the ProjectCard footprint (image-top + two text lines + footer row). */
export function SkeletonProjectCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
      <Skeleton className="aspect-[16/9] rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** Matches the JobCard footprint. */
export function SkeletonJobCard() {
  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-6 w-20 rounded-lg" />
        <Skeleton className="h-6 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-1/2" : "w-full")} />
      ))}
    </div>
  );
}

/** A responsive grid of card skeletons for list-route `loading.tsx` files. */
export function SkeletonCardGrid({
  count = 8,
  variant = "project",
}: {
  count?: number;
  variant?: "project" | "job";
}) {
  const Card = variant === "job" ? SkeletonJobCard : SkeletonProjectCard;
  return (
    <div
      className={cn(
        "grid gap-5",
        variant === "job" ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4",
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} />
      ))}
    </div>
  );
}

export default Skeleton;

/** Shared list footprint, including the compact project thumbnail on phones. */
export function SkeletonCard({ variant = "course" }: { variant?: "course" | "job" | "project" }) {
  if (variant === "job") return <SkeletonJobCard />;
  if (variant === "project") return <div className="card flex min-w-0 overflow-hidden sm:flex-col">
    <Skeleton className="w-24 shrink-0 rounded-none sm:aspect-[16/10] sm:w-full" />
    <div className="min-w-0 flex-1 space-y-3 p-4"><Skeleton className="h-6 w-24" /><Skeleton className="h-12 w-full" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-8 w-20" /></div>
  </div>;
  return <div className="card min-w-0 space-y-3 p-4">
    <div className="flex items-center gap-2"><Skeleton className="h-9 w-9" /><Skeleton className="h-6 w-20" /></div>
    <Skeleton className="h-12 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-11 w-full" />
  </div>;
}

export function ListLoading({ title, variant = "course" }: { title: string; variant?: "course" | "job" | "project" }) {
  return <div className="page-shell" role="status" aria-label={`Loading ${title.toLowerCase()}`}>
    <span className="sr-only">Loading {title.toLowerCase()}…</span>
    <div aria-hidden className="space-y-3">
      <Skeleton className="h-7 w-48" /><Skeleton className="h-11 w-full" />
      <div className="flex gap-2"><Skeleton className="h-11 w-16 rounded-full" /><Skeleton className="h-11 w-24 rounded-full" /></div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} variant={variant} />)}</div>
    </div>
  </div>;
}
