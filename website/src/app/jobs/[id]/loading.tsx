import { Skeleton, SkeletonText } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container-prose py-10">
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-24 rounded-lg" />)}
      </div>
      <div className="mt-8"><SkeletonText lines={6} /></div>
    </div>
  );
}
