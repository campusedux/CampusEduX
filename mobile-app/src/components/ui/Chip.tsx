import React from "react";
import { Text, Pressable } from "react-native";

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function Chip({ label, active, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className="px-4 py-2 rounded-full border mr-2 mb-2"
      style={{ backgroundColor: active ? "#4F39F6" : "#fff", borderColor: active ? "#4F39F6" : "#E5E7EB" }}
    >
      <Text className={active ? "text-white font-medium" : "text-gray-600"}>{label}</Text>
    </Pressable>
  );
}
