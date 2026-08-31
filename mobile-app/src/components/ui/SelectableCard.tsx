import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SelectableCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Card height — course cards are 110, year cards 90 in the mockups. */
  height?: number;
}

/**
 * Grid tile with a centered icon + label and a circular check badge in the
 * top-right when selected. Used by Select Course / Select Year (Module 1) and
 * later by filter / option pickers. Two per row (48% width).
 */
export function SelectableCard({ icon, label, selected, onPress, height = 110 }: SelectableCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl items-center justify-center mb-4"
      style={{
        width: "48%",
        height,
        borderColor: selected ? "#4F39F6" : "#E5E7EB",
        backgroundColor: selected ? "#EEF0FF" : "#FFFFFF",
        borderWidth: selected ? 2 : 1,
      }}
    >
      {selected ? (
        <View
          className="absolute top-2 right-2 w-6 h-6 rounded-full items-center justify-center"
          style={{ backgroundColor: "#4F39F6" }}
        >
          <Ionicons name="checkmark" size={15} color="#FFFFFF" />
        </View>
      ) : null}
      <Ionicons name={icon} size={30} color={selected ? "#4F39F6" : "#6B7280"} />
      <Text className={`mt-2 font-semibold ${selected ? "text-primary" : "text-gray-700"}`}>{label}</Text>
    </Pressable>
  );
}

export default SelectableCard;
