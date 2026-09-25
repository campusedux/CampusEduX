import React from "react";
import { Text, View } from "react-native";
import { RADII, SPACE, useTheme } from "@/theme";
import type { CalloutKind } from "@/learning/reader/calloutConfig";
import { useReaderCtx } from "./readerContext";

/** Coloured, labelled box for a recognised section ("What is it?", "Key Points"…). Body = the section's own content, untouched. */
export function Callout({
  id,
  kind,
  icon,
  label,
  level,
  variant,
  children,
}: {
  id: string;
  /** Source heading level (sizes the heading variant). */
  level: number;
  /** "box" = tinted box; "heading" = icon + accent bar, no box (long / code / table / adjacent sections). */
  variant: "box" | "heading";
  kind: CalloutKind;
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  const { colors, type } = useTheme();
  const { anchors } = useReaderCtx();
  const tone = colors.callout[kind];

  if (variant === "heading") {
    const style = level <= 2 ? type.h2 : level === 3 ? type.h3 : type.h4;
    return (
      <View ref={(r) => anchors.register(id, r)} collapsable={false}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE[2], borderLeftWidth: 4, borderLeftColor: tone.border, paddingLeft: SPACE[3], borderRadius: 2 }}>
          <Text style={{ fontSize: 18 }} accessibilityElementsHidden importantForAccessibility="no">
            {icon}
          </Text>
          <Text accessibilityRole="header" style={[style, { color: tone.label, flex: 1 }]}>
            {label}
          </Text>
        </View>
        <View style={{ marginTop: SPACE[3] }}>{children}</View>
      </View>
    );
  }

  return (
    <View
      ref={(r) => anchors.register(id, r)}
      collapsable={false}
      style={{
        backgroundColor: tone.bg,
        borderLeftWidth: 4,
        borderLeftColor: tone.border,
        borderRadius: RADII.md,
        paddingVertical: SPACE[4],
        paddingHorizontal: SPACE[4],
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE[2] }}>
        <Text style={{ fontSize: 18 }} accessibilityElementsHidden importantForAccessibility="no">
          {icon}
        </Text>
        <Text accessibilityRole="header" style={[type.h4, { color: tone.label, flex: 1 }]}>
          {label}
        </Text>
      </View>
      <View style={{ marginTop: SPACE[3] }}>{children}</View>
    </View>
  );
}
