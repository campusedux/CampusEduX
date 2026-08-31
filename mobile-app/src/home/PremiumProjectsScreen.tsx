import React from "react";
import { ProjectListTemplate } from "@/components/cards";
import { usePremiumProjects } from "@/hooks/useHomeData";

export function PremiumProjectsScreen() {
  const query = usePremiumProjects();
  return (
    <ProjectListTemplate
      title="Premium Projects"
      query={query}
      itemTag="PREMIUM"
      banner={{
        title: "Unlock Premium Projects",
        subtitle: "High quality, industry level projects with source code",
        icon: "diamond-outline",
      }}
      emptyLabel="No premium projects yet"
    />
  );
}

export default PremiumProjectsScreen;
