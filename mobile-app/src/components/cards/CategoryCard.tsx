import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "@/components/ui";
import { CARD_SHADOW } from "@/constants/theme";
import type { ProjectCategory } from "@/types";

interface CategoryCardProps {
  category: ProjectCategory;
  onPress: (category: ProjectCategory) => void;
}

/**
 * Two-per-row category tile used on the "All Categories" screen. Larger icon,
 * soft elevation and a press response so categories feel like a real
 * destination, not a checkbox.
 */
export function CategoryCard({ category, onPress }: CategoryCardProps) {
  return (
    <PressableScale
      onPress={() => onPress(category)}
      className="rounded-2xl border border-gray-100 bg-white p-4 mb-3 items-center"
      style={{ width: "48%", ...CARD_SHADOW }}
    >
      <View
        className="w-14 h-14 rounded-2xl items-center justify-center mb-2.5"
        style={{ backgroundColor: "#EEF0FF" }}
      >
        <Ionicons name={(category.icon || "grid-outline") as any} size={26} color="#4F39F6" />
      </View>
      <Text className="font-semibold text-gray-900 text-center" numberOfLines={1}>
        {category.name}
      </Text>
      <Text className="text-gray-400 text-xs mt-0.5">{category.projectCount}+ Projects</Text>
    </PressableScale>
  );
}

export default CategoryCard;
