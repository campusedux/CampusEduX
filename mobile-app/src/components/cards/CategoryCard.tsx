import React from "react";
import { Text } from "react-native";
import { Card, IconTile } from "@/components/ui";
import type { AccentName } from "@/constants/theme";
import type { ProjectCategory } from "@/types";

interface CategoryCardProps {
  category: ProjectCategory;
  onPress: (category: ProjectCategory) => void;
  /** Feature colour of the tile; defaults to indigo. */
  accent?: AccentName;
}

/**
 * Two-per-row category tile used on the "All Categories" screen: soft-tinted
 * card with a gradient icon square (same look as the Home category tiles).
 */
export function CategoryCard({ category, onPress, accent = "indigo" }: CategoryCardProps) {
  return (
    <Card
      variant="tinted"
      accent={accent}
      onPress={() => onPress(category)}
      accessibilityLabel={`${category.name}, ${category.projectCount} projects`}
      style={{ width: "48%", marginBottom: 12, alignItems: "center" }}
    >
      <IconTile icon={(category.icon || "grid-outline") as any} accent={accent} size={52} />
      <Text className="font-semibold text-gray-900 text-center mt-3" numberOfLines={2} style={{ minHeight: 40 }}>
        {category.name}
      </Text>
      <Text className="text-gray-500 text-xs mt-0.5">{category.projectCount}+ Projects</Text>
    </Card>
  );
}

export default CategoryCard;
