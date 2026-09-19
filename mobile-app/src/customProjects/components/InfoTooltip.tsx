import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/components/ui/BottomSheet";

interface InfoTooltipProps {
  /** The term being explained, e.g. "Token amount". */
  label: string;
  text: string;
}

/** Small ⓘ next to a term; opens a sheet explaining it. Sheet (not a hover bubble) so it works on touch, web and screen readers. */
export function InfoTooltip({ label, text }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={14}
        accessibilityRole="button"
        accessibilityLabel={`What is ${label}?`}
        className="ml-1.5"
        style={{ minWidth: 24, minHeight: 24, alignItems: "center", justifyContent: "center" }}
      >
        <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
        <View className="pb-4">
          <Text className="text-gray-700 leading-6">{text}</Text>
        </View>
      </BottomSheet>
    </>
  );
}

/** A label with its ⓘ, used in receipts and cards. */
export function TermLabel({ term, className }: { term: { label: string; text: string }; className?: string }) {
  return (
    <View className="flex-row items-center flex-shrink">
      <Text className={className ?? "text-gray-500"}>{term.label}</Text>
      <InfoTooltip label={term.label} text={term.text} />
    </View>
  );
}
