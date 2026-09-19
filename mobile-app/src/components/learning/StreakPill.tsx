import React from "react";
import { Text, View } from "react-native";
import { RADII, SPACE, useTheme } from "@/theme";
import { alpha } from "@/theme/colorUtils";

/** 🔥 daily-streak indicator for the Learning Home header. */
export function StreakPill({ days }: { days: number }) {
  const { colors, type } = useTheme();
  const active = days > 0;
  return (
    <View
      accessible
      accessibilityLabel={active ? `${days} day learning streak` : "No streak yet. Learn something today to start one"}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE[1],
        minHeight: 36,
        paddingHorizontal: SPACE[3],
        borderRadius: RADII.pill,
        backgroundColor: active ? alpha(colors.streak, 0.14) : colors.surface,
        borderWidth: 1,
        borderColor: active ? alpha(colors.streak, 0.35) : colors.border,
      }}
    >
      <Text style={{ fontSize: 16, opacity: active ? 1 : 0.45 }}>🔥</Text>
      <Text style={[type.label, { color: active ? colors.warning : colors.textMuted, fontFamily: type.title.fontFamily }]}>
        {active ? `${days} day${days === 1 ? "" : "s"}` : "0 days"}
      </Text>
    </View>
  );
}
