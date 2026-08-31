import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button } from "@/components/ui";
import { useBuilderAutosave } from "../useBuilderAutosave";

export const TOTAL_STEPS = 8;

/** `Step N of 8` label + a thin progress bar. */
export function StepHeader({ step }: { step: number }) {
  const pct = Math.round((step / TOTAL_STEPS) * 100);
  return (
    <View className="mb-4">
      <Text className="text-gray-400 text-xs font-semibold mb-2">
        Step {step} of {TOTAL_STEPS}
      </Text>
      <View className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#4F39F6" }} />
      </View>
    </View>
  );
}

interface WizardScreenProps {
  step: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  children: React.ReactNode;
  /** Rendered just above the Next button (e.g. a running estimate line). */
  footerExtra?: React.ReactNode;
}

/**
 * Common frame for every builder step: back chevron + step progress, a
 * scrollable body, and a sticky footer with the primary action. The wizard
 * keeps all entered data in `useBuilderStore`, so moving Back/Next never loses
 * anything (spec §37).
 */
export function WizardScreen({
  step,
  title,
  subtitle,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  nextLoading,
  children,
  footerExtra,
}: WizardScreenProps) {
  useBuilderAutosave();
  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-3">
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={10} className="mr-3">
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
        ) : null}
        <Text className="text-lg font-bold text-gray-900">Custom Project Builder</Text>
      </View>

      <StepHeader step={step} />

      <Text className="text-xl font-bold text-gray-900">{title}</Text>
      {subtitle ? <Text className="text-gray-500 mt-1 mb-1">{subtitle}</Text> : null}

      <ScrollView
        className="flex-1 -mx-6 px-6 mt-3"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
        <View className="h-6" />
      </ScrollView>

      <View className="pt-3 pb-5">
        {footerExtra}
        <Button label={nextLabel} onPress={onNext} disabled={nextDisabled} loading={nextLoading} />
      </View>
    </Screen>
  );
}

interface OptionRowProps {
  title: string;
  subtitle?: string;
  meta?: string;
  selected: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

/** Full-width single-select row (radio) used for Level and Platform steps. */
export function OptionRow({ title, subtitle, meta, selected, onPress, icon }: OptionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-2xl border px-4 py-4 mb-3"
      style={{ borderColor: selected ? "#4F39F6" : "#E5E7EB", backgroundColor: selected ? "#EEF0FF" : "#FFFFFF" }}
    >
      {icon ? (
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: selected ? "#4F39F620" : "#F3F4F6" }}
        >
          <Ionicons name={icon} size={20} color={selected ? "#4F39F6" : "#6B7280"} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text className={`font-semibold ${selected ? "text-primary" : "text-gray-900"}`}>{title}</Text>
        {subtitle ? <Text className="text-gray-400 text-sm mt-0.5">{subtitle}</Text> : null}
      </View>
      {meta ? (
        <Text className={`font-semibold mr-2 ${selected ? "text-primary" : "text-gray-700"}`}>{meta}</Text>
      ) : null}
      <Ionicons
        name={selected ? "radio-button-on" : "radio-button-off"}
        size={20}
        color={selected ? "#4F39F6" : "#D1D5DB"}
      />
    </Pressable>
  );
}

/** ₹ amount with a thousands separator, matching the rest of the app. */
export function rupees(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}
