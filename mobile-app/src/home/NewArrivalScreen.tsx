import React from "react";
import { ProjectListTemplate } from "@/components/cards";
import { useNewArrivals } from "@/hooks/useHomeData";

export function NewArrivalScreen() {
  const query = useNewArrivals();
  return (
    <ProjectListTemplate
      title="New Arrivals"
      query={query}
      itemTag="NEW"
      banner={{
        title: "New & Fresh",
        subtitle: "Projects Just For You!",
        icon: "sparkles-outline",
        accent: "rose",
      }}
      emptyLabel="No new arrivals yet"
    />
  );
}

export default NewArrivalScreen;
