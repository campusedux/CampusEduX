import { Skeleton, SkeletonText } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container-page py-10">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        <Skeleton className="aspect-[16/10] rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-4 h-40 rounded-2xl" />
        </div>
      </div>
      <div className="mt-12 max-w-3xl">
        <Skeleton className="h-6 w-48" />
        <div className="mt-3"><SkeletonText lines={5} /></div>
      </div>
    </div>
  );
}
