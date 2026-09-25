import React from "react";
import { Text, View } from "react-native";

export interface TimelineStep {
  title: string;
  body?: string;
}

/** Vertical "what happens next" list. */
export function NextStepsTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <View>
      {steps.map((s, i) => (
        <View key={s.title} className="flex-row" accessible accessibilityLabel={`Step ${i + 1}: ${s.title}. ${s.body ?? ""}`}>
          <View className="items-center mr-3">
            <View className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: "#EEF0FF" }}>
              <Text className="text-primary text-xs font-bold">{i + 1}</Text>
            </View>
            {i < steps.length - 1 ? <View className="w-0.5 flex-1 my-1" style={{ backgroundColor: "#E0E3FF", minHeight: 14 }} /> : null}
          </View>
          <View className="flex-1 pb-3">
            <Text className="text-gray-900 font-semibold">{s.title}</Text>
            {s.body ? <Text className="text-gray-500 text-sm mt-0.5">{s.body}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}
