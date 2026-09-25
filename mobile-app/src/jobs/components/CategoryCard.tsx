import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { categoryStyle, formatJobCount, type CategoryRow } from "../jobCategories";
import { J, SOFT_SHADOW } from "./jobsTheme";

interface Props {
  row: CategoryRow;
  width?: number | string;
  onPress: (category: string) => void;
}

/** Compact category tile: tinted icon, name + real count (or a muted "No openings yet"), chevron. */
export function CategoryCard({ row, width, onPress }: Props) {
  const style = categoryStyle(row.category);
  const empty = row.jobCount === 0;
  return (
    <Pressable
      onPress={() => onPress(row.category)}
      accessibilityRole="button"
      accessibilityLabel={`${row.category}, ${empty ? "no openings yet" : formatJobCount(row.jobCount)}`}
      style={(state: any) => [
        {
          width: width as any,
          flexDirection: "row",
          alignItems: "center",
          padding: 14,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: state.hovered || state.pressed ? J.hoverBorder : J.borderSoft,
          backgroundColor: empty ? "#FAFBFD" : "#FFFFFF",
          transform: [{ translateY: state.hovered || state.pressed ? -1 : 0 }],
        },
        empty ? null : SOFT_SHADOW,
      ]}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: empty ? "#F1F5F9" : style.tint,
          marginRight: 12,
        }}
      >
        <Ionicons name={style.icon} size={20} color={empty ? "#94A3B8" : style.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: empty ? J.secondary : J.text }}>
          {row.category}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 12, color: empty ? "#94A3B8" : J.secondary, marginTop: 2 }}>
          {empty ? "No openings yet" : formatJobCount(row.jobCount)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
    </Pressable>
  );
}
