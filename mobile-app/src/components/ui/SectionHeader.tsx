import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ACCENTS, AccentName, MIN_TOUCH } from "@/constants/theme";

interface SectionHeaderProps {
  title: string;
  onViewAll?: () => void;
  /** Small line under the title. */
  subtitle?: string;
  /** Adds a short accent bar before the title. */
  accent?: AccentName;
  /** Replaces the default "View All" label. */
  actionLabel?: string;
}

export function SectionHeader({ title, onViewAll, subtitle, accent, actionLabel = "View All" }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <View className="flex-row items-center flex-1 mr-3">
        {accent ? (
          <View style={{ width: 4, height: 20, borderRadius: 2, marginRight: 8, backgroundColor: ACCENTS[accent].base }} />
        ) : null}
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {onViewAll && (
        <Pressable
          onPress={onViewAll}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel} ${title}`}
          className="flex-row items-center justify-end"
          style={{ minHeight: MIN_TOUCH, minWidth: MIN_TOUCH }}
        >
          <Text className="text-primary text-sm font-medium">{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color="#4F39F6" style={{ marginLeft: 2 }} />
        </Pressable>
      )}
    </View>
  );
}
