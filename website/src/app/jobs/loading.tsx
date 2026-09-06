import { SkeletonCardGrid, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container-page py-10">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
      <Skeleton className="mt-6 h-11 w-full max-w-xl rounded-xl" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <Skeleton className="hidden h-72 rounded-2xl lg:block" />
        <SkeletonCardGrid count={6} variant="job" />
      </div>
    </div>
  );
}
