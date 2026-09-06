import { SkeletonCardGrid, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container-page py-10">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-3 h-4 w-72" />
      <div className="mt-8">
        <SkeletonCardGrid count={9} variant="project" />
      </div>
    </div>
  );
}
