import { cn } from "@/lib/cn";

/** Shimmer block. Compose the presets below or use directly with a size class. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-line/70", className)} aria-hidden />;
}

/** Matches the ProjectCard footprint (image-top + two text lines + footer row). */
export function SkeletonProjectCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <Skeleton className="aspect-[16/10] rounded-none" />
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
    <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
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
