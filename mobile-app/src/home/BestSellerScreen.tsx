import React from "react";
import { ProjectListTemplate } from "@/components/cards";
import { useBestSellers } from "@/hooks/useHomeData";

export function BestSellerScreen() {
  const query = useBestSellers();
  return (
    <ProjectListTemplate
      title="Best Sellers"
      query={query}
      banner={{
        title: "Most Purchased",
        subtitle: "By Our Users",
        icon: "trophy-outline",
        accent: "amber",
      }}
      emptyLabel="No best sellers yet"
    />
  );
}

export default BestSellerScreen;
