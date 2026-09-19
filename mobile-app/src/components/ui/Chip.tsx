import React from "react";
import { Text, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, MIN_TOUCH } from "@/constants/theme";

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  /** Optional leading icon. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Optional trailing count (e.g. number of results). Shown only when provided. */
  count?: number;
  /** Active fill colour (defaults to the brand primary). */
  accent?: string;
}

/** Selectable filter pill. 44px tall touch target. */
export function Chip({ label, active, onPress, icon, count, accent = COLORS.primary }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="px-4 py-2 rounded-full border mr-2 mb-2 flex-row items-center justify-center"
      style={{ backgroundColor: active ? accent : "#fff", borderColor: active ? accent : "#E5E7EB", minHeight: MIN_TOUCH }}
    >
      {icon ? <Ionicons name={icon} size={16} color={active ? "#FFFFFF" : COLORS.textSecondary} style={{ marginRight: 6 }} /> : null}
      <Text className={active ? "text-white font-medium" : "text-gray-600"}>{label}</Text>
      {count !== undefined ? (
        <View
          style={{
            marginLeft: 6,
            minWidth: 20,
            paddingHorizontal: 6,
            borderRadius: 10,
            alignItems: "center",
            backgroundColor: active ? "rgba(255,255,255,0.25)" : "#F1F2F6",
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "700", color: active ? "#FFFFFF" : COLORS.textSecondary }}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
