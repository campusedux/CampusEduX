import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ACCENTS, AccentName, accentTint, coloredShadow } from "@/constants/theme";

type IconName = keyof typeof Ionicons.glyphMap;

interface IconTileProps {
  icon: IconName;
  accent?: AccentName;
  /** Overrides the accent gradient (light → dark). */
  colors?: readonly [string, string];
  /** "gradient" = white glyph on a gradient square; "soft" = accent glyph on a tinted square. */
  variant?: "gradient" | "soft";
  size?: number;
}

/** Rounded icon square used for feature identity — the shared version of the Home tile icon. */
export function IconTile({ icon, accent = "indigo", colors, variant = "gradient", size = 48 }: IconTileProps) {
  const radius = Math.round(size * 0.29);
  const glyph = Math.round(size * 0.5);

  if (variant === "soft") {
    const t = accentTint(accent);
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: t.soft,
          borderWidth: 1,
          borderColor: t.border,
        }}
      >
        <Ionicons name={icon} size={glyph} color={t.base} />
      </View>
    );
  }

  const stops = colors ?? ACCENTS[accent].colors;
  return (
    <View style={[{ width: size, height: size, borderRadius: radius }, coloredShadow(stops[1], "sm")]}>
      <LinearGradient
        colors={[stops[0], stops[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, borderRadius: radius, alignItems: "center", justifyContent: "center" }}
      >
        <Ionicons name={icon} size={glyph} color="#FFFFFF" />
      </LinearGradient>
    </View>
  );
}
