import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { InfoTooltip } from "./InfoTooltip";
import { TERMS } from "./builderCopy";
import type { CustomFeature } from "@/types";

// Long lists open expanded the first time the customer sees them, then stay collapsed on later visits.
let hasSeenIncludedList = false;

interface FeatureIncludedListProps {
  features: CustomFeature[];
  /** "Standard" / "Advanced" */
  levelLabel: string;
  /** Show the "these come free" helper line (off on the estimate page). */
  showHelper?: boolean;
  collapsible?: boolean;
}

/** Read-only list of the features that come free with the project — never toggleable. */
export function FeatureIncludedList({ features, levelLabel, showHelper = true, collapsible = true }: FeatureIncludedListProps) {
  const [open, setOpen] = useState(() => {
    const initial = !hasSeenIncludedList || features.length <= 8;
    hasSeenIncludedList = true;
    return initial;
  });

  const groups = useMemo(() => {
    const map = new Map<string, CustomFeature[]>();
    for (const f of features) map.set(f.category, [...(map.get(f.category) ?? []), f]);
    return [...map.entries()];
  }, [features]);

  const expanded = !collapsible || open;

  return (
    <View className="rounded-2xl border p-4 mb-4" style={{ borderColor: "#BBF7D0", backgroundColor: "#F0FDF4" }}>
      <Pressable
        onPress={() => collapsible && setOpen((v) => !v)}
        accessibilityRole={collapsible ? "button" : undefined}
        accessibilityState={collapsible ? { expanded } : undefined}
        accessibilityLabel={`Included in your project, ${features.length} features included`}
        className="flex-row items-center"
        style={{ minHeight: 44 }}
      >
        <Ionicons name="gift-outline" size={20} color="#16A34A" />
        <Text className="text-gray-900 font-bold text-base ml-2">Included in your project</Text>
        <InfoTooltip label={TERMS.included.label} text={TERMS.included.text} />
        <View className="flex-1" />
        <View className="rounded-full px-2.5 py-1 mr-2" style={{ backgroundColor: "#DCFCE7" }}>
          <Text className="text-xs font-bold" style={{ color: "#166534" }}>
            {features.length} feature{features.length === 1 ? "" : "s"} included
          </Text>
        </View>
        {collapsible ? <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color="#6B7280" /> : null}
      </Pressable>

      {showHelper ? (
        <Text className="text-gray-600 text-sm mt-1">
          These features come with your {levelLabel} project at no extra cost.
        </Text>
      ) : null}

      {expanded ? (
        features.length === 0 ? (
          <Text className="text-gray-500 text-sm mt-3">
            No features are bundled with this level — add what you need below.
          </Text>
        ) : (
          groups.map(([category, rows]) => (
            <View key={category} className="mt-3">
              <Text className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1.5">{category}</Text>
              {rows.map((f) => (
                <View key={f.id} className="flex-row py-1.5" accessible accessibilityLabel={`${f.name}, included`}>
                  <Ionicons name="checkmark-circle" size={18} color="#16A34A" style={{ marginTop: 1 }} />
                  <View className="flex-1 ml-2.5">
                    <Text className="text-gray-900 font-medium">{f.name}</Text>
                    {f.description ? <Text className="text-gray-500 text-xs mt-0.5">{f.description}</Text> : null}
                  </View>
                  <Text className="text-xs font-semibold ml-2" style={{ color: "#166534" }}>
                    Free
                  </Text>
                </View>
              ))}
            </View>
          ))
        )
      ) : null}
    </View>
  );
}
