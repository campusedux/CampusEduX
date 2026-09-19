import React from "react";
import { Platform, ScrollView, Text, TextInput, View, type TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "@/components/ui/PressableScale";
import { RADII, SPACE, TOUCH, useTheme } from "@/theme";
import type { CourseFilter } from "@/learning/learningFormat";

const CHIPS: { key: CourseFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in-progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "bookmarked", label: "Bookmarked" },
];

/** Search field + filter chips. Meant to live inside a sticky header. */
export function LearningSearchBar({
  value,
  onChange,
  filter,
  onFilter,
  showChips,
}: {
  value: string;
  onChange: (v: string) => void;
  filter: CourseFilter;
  onFilter: (f: CourseFilter) => void;
  showChips: boolean;
}) {
  const { colors, type } = useTheme();
  const webReset = Platform.OS === "web" ? ({ outlineStyle: "none" } as unknown as TextStyle) : null;
  return (
    <View style={{ gap: SPACE[3] }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          minHeight: 48,
          paddingLeft: SPACE[4],
          borderRadius: RADII.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Search all topics…"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search all learning topics"
          selectionColor={colors.primary}
          style={[type.title, { flex: 1, minHeight: 46, marginLeft: SPACE[2], color: colors.text, fontFamily: type.body.fontFamily, fontSize: 16 }, webReset]}
        />
        {value ? (
          <PressableScale
            onPress={() => onChange("")}
            accessibilityLabel="Clear search"
            activeScale={0.9}
            style={{ width: TOUCH.min, height: 46, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </PressableScale>
        ) : null}
      </View>

      {showChips ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: SPACE[2], paddingRight: SPACE[2] }}>
          {CHIPS.map((c) => {
            const on = c.key === filter;
            return (
              <PressableScale
                key={c.key}
                onPress={() => onFilter(c.key)}
                activeScale={0.95}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${c.label} filter`}
                hitSlop={{ top: 4, bottom: 4 }}
                style={{
                  minHeight: 40,
                  paddingHorizontal: SPACE[4],
                  borderRadius: RADII.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: on ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: on ? colors.primary : colors.border,
                }}
              >
                <Text style={[type.label, { color: on ? colors.textOnAccent : colors.textSecondary, fontFamily: type.title.fontFamily }]}>{c.label}</Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}
