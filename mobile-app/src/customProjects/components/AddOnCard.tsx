import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { rupees } from "./format";
import type { CustomFeature } from "@/types";

interface AddOnCardProps {
  feature: CustomFeature;
  /** Amount actually charged for this add-on (after the Academic override). */
  price: number;
  selected: boolean;
  onToggle: () => void;
  /** Names of paid features this one needs (already-included ones are omitted). */
  requires?: string[];
  /** Advanced-only on a Standard project: shown locked with a link to switch level. */
  locked?: { includedInAdvanced: boolean };
  onSwitchLevel?: () => void;
}

/** One optional, paid feature — a clear Add / Added button rather than a small checkbox. */
export function AddOnCard({ feature, price, selected, onToggle, requires, locked, onSwitchLevel }: AddOnCardProps) {
  const priceLabel = price > 0 ? `+${rupees(price)}` : "Free";

  return (
    <View
      className="rounded-2xl border p-4 mb-3"
      style={{
        borderColor: selected ? "#4F39F6" : "#E5E7EB",
        backgroundColor: locked ? "#F9FAFB" : selected ? "#EEF0FF" : "#FFFFFF",
      }}
    >
      <View className="flex-row items-start">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center flex-wrap">
            {locked ? <Ionicons name="lock-closed" size={14} color="#9CA3AF" style={{ marginRight: 6 }} /> : null}
            <Text className={`font-semibold ${locked ? "text-gray-500" : "text-gray-900"}`}>{feature.name}</Text>
          </View>
          {feature.description ? <Text className="text-gray-500 text-sm mt-1">{feature.description}</Text> : null}
          {requires && requires.length > 0 ? (
            <Text className="text-xs mt-1.5" style={{ color: "#B45309" }}>
              Also adds: {requires.join(", ")}
            </Text>
          ) : null}
        </View>
        <Text className={`font-bold ${locked ? "text-gray-400" : "text-gray-900"}`}>
          {locked ? (locked.includedInAdvanced ? "Included" : priceLabel) : priceLabel}
        </Text>
      </View>

      {locked ? (
        <Pressable
          onPress={onSwitchLevel}
          accessibilityRole="link"
          accessibilityLabel={`${feature.name} is available in Advanced. Switch level`}
          className="flex-row items-center mt-3"
          style={{ minHeight: 44 }}
        >
          <Text className="text-primary font-semibold text-sm">
            {locked.includedInAdvanced ? "Included with Advanced" : "Available in Advanced"} — switch level
          </Text>
          <Ionicons name="arrow-forward" size={14} color="#4F39F6" style={{ marginLeft: 4 }} />
        </Pressable>
      ) : (
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel={`${selected ? "Remove" : "Add"} ${feature.name}, ${priceLabel}`}
          className="flex-row items-center justify-center rounded-xl mt-3"
          style={{
            minHeight: 44,
            backgroundColor: selected ? "#4F39F6" : "#FFFFFF",
            borderWidth: 1,
            borderColor: "#4F39F6",
          }}
        >
          <Ionicons name={selected ? "checkmark" : "add"} size={18} color={selected ? "#FFFFFF" : "#4F39F6"} />
          <Text className={`font-semibold ml-1.5 ${selected ? "text-white" : "text-primary"}`}>
            {selected ? "Added" : "Add"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
