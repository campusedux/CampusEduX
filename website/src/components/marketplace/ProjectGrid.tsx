import ProjectCard, { ProjectCardData } from "@/components/ProjectCard";
import { LayoutGrid } from "lucide-react";
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
    return <EmptyState className="mt-8" icon={LayoutGrid} title={emptyTitle} subtitle={emptySubtitle ?? "Check back soon, or browse the whole marketplace."} />;
  }
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
      {projects.map((p, i) => (
        <ProjectCard key={p.id} project={p} rank={showRank && i < 3 ? i + 1 : undefined} />
      ))}
    </div>
  );
}

export default ProjectGrid;
