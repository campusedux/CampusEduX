import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "./PressableScale";
import { AccentName, COLORS, STATUS, accentTint } from "@/constants/theme";

interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Tint of the icon tile. */
  accent?: AccentName;
  /** Right-aligned text value (e.g. "English", "₹250"). */
  value?: string;
  /** Custom trailing node (Switch, Badge, ...). Replaces the chevron. */
  right?: React.ReactNode;
  onPress?: () => void;
  /** Chevron is shown by default on pressable rows without a `right` node. */
  showChevron?: boolean;
  /** Red styling for Logout / Delete. */
  destructive?: boolean;
  /** Bottom hairline; turn on for rows stacked inside one Card. */
  divider?: boolean;
}

/** Settings / Profile / list row: tinted icon tile, title + subtitle, value/chevron. Min 56px tall. */
export function ListItem({ title, subtitle, icon, accent = "indigo", value, right, onPress, showChevron, destructive, divider }: ListItemProps) {
  const tint = destructive ? { base: STATUS.danger.base, soft: STATUS.danger.soft, border: "#FECACA" } : accentTint(accent);
  const chevron = showChevron ?? (!!onPress && !right);

  const body = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        minHeight: 56,
        paddingVertical: 8,
        gap: 12,
        borderBottomWidth: divider ? 1 : 0,
        borderBottomColor: COLORS.borderSoft,
      }}
    >
      {icon ? (
        <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: tint.soft, borderWidth: 1, borderColor: tint.border }}>
          <Ionicons name={icon} size={20} color={tint.base} />
        </View>
      ) : null}
      <View style={{ flex: 1, flexShrink: 1 }}>
        <Text numberOfLines={2} style={{ fontSize: 15, lineHeight: 20, fontWeight: "600", color: destructive ? STATUS.danger.strong : COLORS.textPrimary }}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={2} style={{ fontSize: 13, lineHeight: 18, marginTop: 1, color: COLORS.textMuted }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text numberOfLines={1} style={{ fontSize: 14, color: COLORS.textMuted, maxWidth: "35%" }}>
          {value}
        </Text>
      ) : null}
      {right}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={COLORS.textDisabled} /> : null}
    </View>
  );

  if (!onPress) return body;
  return (
    <PressableScale onPress={onPress} activeScale={0.985} accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}>
      {body}
    </PressableScale>
  );
}
