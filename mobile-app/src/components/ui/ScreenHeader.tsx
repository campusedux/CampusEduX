import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ACCENTS, AccentName, COLORS, MIN_TOUCH, coloredShadow } from "@/constants/theme";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Renders the back button when provided (screens pass `() => navigation.goBack()`). */
  onBack?: () => void;
  /** Node before the title, e.g. `<DrawerMenuButton />` on tab roots. */
  leading?: React.ReactNode;
  /** Node at the trailing edge (icon buttons, actions). */
  right?: React.ReactNode;
  /** plain = flat row; gradient = rounded accent hero panel with white text. */
  variant?: "plain" | "gradient";
  accent?: AccentName;
  /** Icon shown in the gradient hero. */
  icon?: keyof typeof Ionicons.glyphMap;
}

/** 44px round icon button used by ScreenHeader (and reusable for its `right` slot). */
export function HeaderIconButton({
  icon,
  onPress,
  label,
  onDark,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string;
  onDark?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: MIN_TOUCH,
        height: MIN_TOUCH,
        borderRadius: MIN_TOUCH / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: onDark ? "rgba(255,255,255,0.18)" : COLORS.surface,
      }}
    >
      <Ionicons name={icon} size={22} color={onDark ? "#FFFFFF" : COLORS.textPrimary} />
    </Pressable>
  );
}

/**
 * Standard screen header: optional back button / leading node, title with
 * optional subtitle, optional right-side actions. Replaces the ~120
 * hand-rolled header rows. Titles wrap safely under large system fonts.
 */
export function ScreenHeader({ title, subtitle, onBack, leading, right, variant = "plain", accent = "indigo", icon }: ScreenHeaderProps) {
  const gradient = variant === "gradient";
  const titleBlock = (
    <View style={{ flex: 1, flexShrink: 1 }}>
      <Text
        numberOfLines={2}
        accessibilityRole="header"
        style={{ fontSize: gradient ? 22 : 20, lineHeight: gradient ? 28 : 26, fontWeight: "700", color: gradient ? "#FFFFFF" : COLORS.textPrimary }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text numberOfLines={2} style={{ fontSize: 13, lineHeight: 18, marginTop: 2, color: gradient ? "rgba(255,255,255,0.85)" : COLORS.textMuted }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );

  const row = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      {onBack ? <HeaderIconButton icon="arrow-back" onPress={onBack} label="Go back" onDark={gradient} /> : null}
      {leading}
      {gradient && icon ? (
        <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.18)" }}>
          <Ionicons name={icon} size={22} color="#FFFFFF" />
        </View>
      ) : null}
      {titleBlock}
      {right}
    </View>
  );

  if (!gradient) {
    return <View style={{ minHeight: 56, justifyContent: "center", marginTop: 8, marginBottom: 16 }}>{row}</View>;
  }

  const stops = ACCENTS[accent].colors;
  return (
    <View style={[{ borderRadius: 24, marginTop: 8, marginBottom: 16, backgroundColor: stops[1] }, coloredShadow(stops[0], "md")]}>
      <LinearGradient
        colors={[stops[0], stops[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 16, overflow: "hidden" }}
      >
        <View pointerEvents="none" style={{ position: "absolute", top: -34, right: -24, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.10)" }} />
        {row}
      </LinearGradient>
    </View>
  );
}
