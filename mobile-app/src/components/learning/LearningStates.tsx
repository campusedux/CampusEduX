import React from "react";
import { Text, View } from "react-native";
import { RADII, SPACE, TOUCH, useTheme } from "@/theme";
import { PressableScale } from "@/components/ui/PressableScale";

/** Friendly empty / error block (emoji + message + optional action). Themed for light + dark. */
export function StateBlock({
  emoji,
  title,
  message,
  actionLabel,
  onAction,
  tone = "neutral",
}: {
  emoji: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "neutral" | "error";
}) {
  const { colors, type } = useTheme();
  const bubble = tone === "error" ? colors.dangerSoft : colors.primarySoft;
  return (
    <View accessibilityRole={tone === "error" ? "alert" : undefined} style={{ alignItems: "center", paddingVertical: SPACE[12], paddingHorizontal: SPACE[6] }}>
      <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: bubble, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 40 }}>{emoji}</Text>
      </View>
      <Text style={[type.h3, { color: colors.text, textAlign: "center", marginTop: SPACE[4] }]}>{title}</Text>
      {message ? (
        <Text style={[type.small, { color: colors.textSecondary, textAlign: "center", marginTop: SPACE[1], maxWidth: 360 }]}>{message}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <PressableScale
          onPress={onAction}
          accessibilityLabel={actionLabel}
          style={{
            marginTop: SPACE[5],
            minHeight: TOUCH.min,
            paddingHorizontal: SPACE[6],
            borderRadius: RADII.md,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={[type.button, { color: colors.textOnAccent }]}>{actionLabel}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}
