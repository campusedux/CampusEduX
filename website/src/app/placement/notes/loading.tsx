import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Skeleton className="h-9 w-52" />
      <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
      <Skeleton className="mt-6 h-11 w-full max-w-xl rounded-xl" />
      <div className="mt-5 flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
