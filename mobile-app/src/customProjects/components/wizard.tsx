import React from "react";
import { View, Text, Pressable, ScrollView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui";
import { useBuilderAutosave } from "../useBuilderAutosave";
import { useBuilderEstimate } from "../useBuilderEstimate";
import { PriceFooterBar } from "./PriceFooterBar";
import { ProjectSummaryPanel } from "./ProjectSummaryPanel";
import { StepHeader } from "./StepHeader";
import { useIsWide } from "./layout";

// Sticky positioning only exists on web; native ignores the (empty) object.
const STICKY: object = Platform.select({ web: { position: "sticky", top: 16, alignSelf: "flex-start" }, default: {} }) as object;

interface WizardScreenProps {
  step: number;
  title: string;
  /** One line on WHY this step matters. */
  helper: string;
  onBack?: () => void;
  onNext: () => void;
  /** Says what comes next, e.g. "Continue to uploads". */
  nextLabel: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  /** Shown as text next to a disabled button so the reason is never hidden. */
  disabledReason?: string;
  /** Sticky "Your project so far" summary — steps 2–6. */
  showSummary?: boolean;
  /** Live price in the footer — steps 2–7. */
  showPrice?: boolean;
  children: React.ReactNode;
}

/**
 * Common frame for every builder step: back + step header, a scrollable body
 * (single column on mobile; body + sticky summary on wide screens) and a sticky
 * footer with the live price and the primary action. The wizard keeps all
 * entered data in `useBuilderStore`, so Back/Next never loses anything.
 */
export function WizardScreen({
  step,
  title,
  helper,
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  nextLoading,
  disabledReason,
  showSummary = step >= 2 && step <= 6,
  showPrice = step >= 2 && step <= 7,
  children,
}: WizardScreenProps) {
  useBuilderAutosave();
  const wide = useIsWide();
  const { estimate, isLoading } = useBuilderEstimate();

  const body = (
    <>
      <Text className="text-2xl font-bold text-gray-900" accessibilityRole="header">
        {title}
      </Text>
      <Text className="text-gray-500 mt-1 mb-4">{helper}</Text>
      {children}
    </>
  );

  return (
    <Screen>
      {/* minHeight:0 lets the ScrollView shrink to the space above the footer, so the page scrolls from its true top on web. */}
      <View style={{ flex: 1, minHeight: 0 }}>
        <View className="px-4 pt-2">
          <View className="flex-row items-center mb-3">
            {onBack ? (
              <Pressable
                onPress={onBack}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={8}
                className="mr-2 items-center justify-center"
                style={{ width: 44, height: 44 }}
              >
                <Ionicons name="arrow-back" size={22} color="#111827" />
              </Pressable>
            ) : null}
            <Text className="text-lg font-bold text-gray-900">Custom Project Builder</Text>
          </View>
          <StepHeader step={step} />
        </View>

        <ScrollView
          style={{ flex: 1, minHeight: 0 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {wide && showSummary ? (
            <View className="flex-row" style={{ gap: 24 }}>
              <View style={{ flex: 1, minWidth: 0 }}>{body}</View>
              <View style={[{ width: 320 }, STICKY]}>
                <ProjectSummaryPanel variant="panel" />
              </View>
            </View>
          ) : (
            <>
              {!wide && showSummary ? <ProjectSummaryPanel variant="card" /> : null}
              {body}
            </>
          )}
        </ScrollView>

        <PriceFooterBar
          estimate={showPrice ? estimate : undefined}
          loading={isLoading}
          label={nextLabel}
          onPress={onNext}
          disabled={nextDisabled}
          submitting={nextLoading}
          disabledReason={disabledReason}
        />
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
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}${meta ? `, ${meta}` : ""}`}
      className="flex-row items-center rounded-2xl border px-4 py-4 mb-3"
      style={{ minHeight: 44, borderColor: selected ? "#4F39F6" : "#E5E7EB", backgroundColor: selected ? "#EEF0FF" : "#FFFFFF" }}
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
        {subtitle ? <Text className="text-gray-500 text-sm mt-0.5">{subtitle}</Text> : null}
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

/** White card with a bold heading, used to group content on every step. */
export function SectionCard({ title, right, children }: { title?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View className="rounded-2xl border border-gray-100 bg-white p-4 mb-4">
      {title || right ? (
        <View className="flex-row items-center justify-between mb-2">
          {typeof title === "string" ? <Text className="font-bold text-gray-900">{title}</Text> : title}
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}
