import ProjectCard, { ProjectCardData } from "@/components/ProjectCard";
import { EmptyState } from "@/components/ui";

/** Shared responsive project grid + empty state for the curated list pages. */
export function ProjectGrid({
  projects,
  emptyTitle = "Nothing here yet",
  emptySubtitle,
  showRank = false,
}: {
  projects: ProjectCardData[];
  emptyTitle?: string;
  emptySubtitle?: string;
  showRank?: boolean;
}) {
  if (projects.length === 0) {
    return <EmptyState className="mt-8" title={emptyTitle} subtitle={emptySubtitle} />;
  }
  return (
    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {projects.map((p, i) => (
        <ProjectCard key={p.id} project={p} rank={showRank && i < 3 ? i + 1 : undefined} />
      ))}
    </div>
  );
}

export default ProjectGrid;
