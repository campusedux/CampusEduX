import React from "react";
import { ProjectListTemplate } from "@/components/cards";
import { useTrendingProjects } from "@/hooks/useHomeData";

export function TrendingProjectsScreen() {
  const query = useTrendingProjects();
  return (
    <ProjectListTemplate
      title="Trending Projects"
      query={query}
      ranked
      emptyLabel="No trending projects right now"
    />
  );
}

export default TrendingProjectsScreen;
