import { SkeletonCardGrid, Skeleton, SkeletonText } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container-page py-10">
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="mt-4 max-w-2xl">
        <SkeletonText lines={3} />
      </div>
      <Skeleton className="mt-10 h-6 w-40" />
      <div className="mt-4">
        <SkeletonCardGrid count={4} variant="job" />
      </div>
    </div>
  );
}
