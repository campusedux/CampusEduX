import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BUILDER_STEPS, TOTAL_STEPS, stepName } from "./builderCopy";
import { useIsWide } from "./layout";

/** "Step 5 of 8 · Features" + progress bar; on wide screens the whole path with names. */
export function StepHeader({ step }: { step: number }) {
  const wide = useIsWide();
  const pct = Math.round((step / TOTAL_STEPS) * 100);

  if (wide) {
    return (
      <View
        className="flex-row mb-4"
        accessibilityRole="progressbar"
        accessibilityLabel={`Step ${step} of ${TOTAL_STEPS}, ${stepName(step)}`}
      >
        {BUILDER_STEPS.map((s) => {
          const done = s.step < step;
          const current = s.step === step;
          return (
            <View key={s.step} className="flex-1 items-center">
              <View className="flex-row items-center self-stretch">
                <View className="flex-1 h-0.5" style={{ backgroundColor: s.step === 1 ? "transparent" : done || current ? "#4F39F6" : "#E5E7EB" }} />
                <View
                  className="w-7 h-7 rounded-full items-center justify-center"
                  style={{ backgroundColor: done || current ? "#4F39F6" : "#F3F4F6" }}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  ) : (
                    <Text className={`text-xs font-bold ${current ? "text-white" : "text-gray-500"}`}>{s.step}</Text>
                  )}
                </View>
                <View className="flex-1 h-0.5" style={{ backgroundColor: s.step === TOTAL_STEPS ? "transparent" : done ? "#4F39F6" : "#E5E7EB" }} />
              </View>
              <Text className={`text-xs mt-1 ${current ? "text-primary font-bold" : "text-gray-500"}`} numberOfLines={1}>
                {s.name}
              </Text>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View className="mb-3" accessibilityRole="progressbar" accessibilityLabel={`Step ${step} of ${TOTAL_STEPS}, ${stepName(step)}`}>
      <Text className="text-gray-500 text-xs font-semibold mb-2">
        Step {step} of {TOTAL_STEPS} · {stepName(step)}
      </Text>
      <View className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#4F39F6" }} />
      </View>
    </View>
  );
}
