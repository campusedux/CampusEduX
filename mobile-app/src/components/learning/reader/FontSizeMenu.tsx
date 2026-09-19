import React from "react";
import { Pressable, Text, View } from "react-native";
import { LAYOUT, RADII, SPACE, useTheme } from "@/theme";
import type { ReaderFontSize } from "@/theme";

const OPTIONS: { key: ReaderFontSize; label: string; sample: number }[] = [
  { key: "small", label: "Small", sample: 14 },
  { key: "medium", label: "Medium", sample: 18 },
  { key: "large", label: "Large", sample: 23 },
];

/** "Aa" popover: Small / Medium / Large. Absolutely positioned under the top bar; tap outside to dismiss. */
export function FontSizeMenu({ open, size, onSelect, onClose, top }: { open: boolean; size: ReaderFontSize; onSelect: (s: ReaderFontSize) => void; onClose: () => void; top: number }) {
  const { colors, type, shadow, gutter } = useTheme();
  if (!open) return null;
  return (
    <>
      <Pressable accessibilityLabel="Close text size menu" onPress={onClose} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 10 }} />
      <View
        accessibilityRole="radiogroup"
        style={[
          {
            position: "absolute",
            top,
            right: gutter,
            zIndex: 11,
            width: 260,
            maxWidth: LAYOUT.pageMaxWidth,
            padding: SPACE[3],
            borderRadius: RADII.lg,
            backgroundColor: colors.surfaceRaised,
            borderWidth: 1,
            borderColor: colors.border,
          },
          shadow("lg"),
        ]}
      >
        <Text style={[type.overline, { color: colors.textMuted, marginBottom: SPACE[2], marginLeft: SPACE[1] }]}>Text size</Text>
        <View style={{ flexDirection: "row", gap: SPACE[2] }}>
          {OPTIONS.map((o) => {
            const on = o.key === size;
            return (
              <Pressable
                key={o.key}
                onPress={() => {
                  onSelect(o.key);
                  onClose();
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${o.label} text`}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 64,
                  borderRadius: RADII.md,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  backgroundColor: on ? colors.primary : pressed ? colors.surfacePressed : colors.canvas,
                  borderWidth: 1,
                  borderColor: on ? colors.primary : colors.border,
                })}
              >
                <Text style={{ fontFamily: type.title.fontFamily, fontSize: o.sample, color: on ? colors.textOnAccent : colors.text }}>Aa</Text>
                <Text style={[type.caption, { color: on ? colors.textOnAccent : colors.textSecondary }]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}
