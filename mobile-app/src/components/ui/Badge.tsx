import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ACCENTS, AccentName, COLORS, STATUS, StatusTone, withAlpha } from "@/constants/theme";

export type BadgeTone = StatusTone | AccentName | "primary" | "neutral";

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  /** soft = tinted fill + dark text; solid = filled + white text. */
  variant?: "soft" | "solid";
  icon?: keyof typeof Ionicons.glyphMap;
  size?: "sm" | "md";
}

function palette(tone: BadgeTone): { base: string; soft: string; text: string } {
  if (tone === "neutral") return { base: COLORS.textMuted, soft: "#F1F2F6", text: COLORS.textSecondary };
  if (tone === "primary") return { base: COLORS.primary, soft: COLORS.primaryLight, text: COLORS.primaryDark };
  if (tone in STATUS) {
    const s = STATUS[tone as StatusTone];
    return { base: s.base, soft: s.soft, text: s.strong };
  }
  const a = ACCENTS[tone as AccentName];
  return { base: a.colors[1], soft: withAlpha(a.base, 0.12), text: a.colors[1] };
}

/**
 * Small non-interactive status / label pill ("NEW", "PREMIUM", "Applied",
 * difficulty). Solid badges use the dark end of the tone so white text keeps
 * AA contrast.
 */
export function Badge({ label, tone = "primary", variant = "soft", icon, size = "md" }: BadgeProps) {
  const p = palette(tone);
  const solid = variant === "solid";
  const fg = solid ? "#FFFFFF" : p.text;
  const small = size === "sm";
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        borderRadius: 999,
        paddingHorizontal: small ? 7 : 10,
        paddingVertical: small ? 2 : 4,
        backgroundColor: solid ? p.base : p.soft,
      }}
    >
      {icon ? <Ionicons name={icon} size={small ? 10 : 12} color={fg} style={{ marginRight: 3 }} /> : null}
      <Text style={{ fontSize: small ? 10 : 12, lineHeight: small ? 14 : 16, fontWeight: "700", color: fg }}>{label}</Text>
    </View>
  );
}

/** Alias: same component, for call sites that read better as "Pill". */
export const Pill = Badge;
