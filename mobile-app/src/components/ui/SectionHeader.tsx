import React from "react";
import { View, Text, Pressable } from "react-native";

interface SectionHeaderProps {
  title: string;
  onViewAll?: () => void;
}

export function SectionHeader({ title, onViewAll }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-lg font-bold text-gray-900">{title}</Text>
      {onViewAll && (
        <Pressable onPress={onViewAll}>
          <Text className="text-primary text-sm font-medium">View All</Text>
        </Pressable>
      )}
    </View>
  );
}
