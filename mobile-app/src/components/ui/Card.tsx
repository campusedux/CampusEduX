import React from "react";
import { Animated, View, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PressableScale } from "./PressableScale";
import { useEnterAnimation } from "./useEnterAnimation";
import {
  ACCENTS,
  AccentName,
  COLORS,
  RADIUS,
  SHADOWS,
  ShadowLevel,
  accentTint,
  coloredShadow,
} from "@/constants/theme";

interface CardProps {
  /** plain = white + soft shadow; tinted = accent wash + tinted border; gradient = full accent gradient. */
  variant?: "plain" | "tinted" | "gradient";
  accent?: AccentName;
  /** Makes the card pressable (PressableScale feedback). */
  onPress?: () => void;
  /** Plain cards only. */
  shadow?: ShadowLevel;
  /** Inner padding in px. */
  padding?: number;
  radius?: number;
  /** Set to play the Home-style staggered entrance. Leave unset in long lists. */
  enterIndex?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
  children?: React.ReactNode;
}

function Enter({ index, children }: { index: number; children: React.ReactNode }) {
  const enter = useEnterAnimation(index);
  return <Animated.View style={enter}>{children}</Animated.View>;
}

/**
 * The one card surface for the app. Variants mirror the Home screen:
 * plain (list items), tinted (soft category tiles) and gradient (hero cards
 * with a coloured shadow and decorative circles). White text on gradient
 * cards is always on the dark gradient stop.
 */
export function Card({
  variant = "plain",
  accent = "indigo",
  onPress,
  shadow = "sm",
  padding = 16,
  radius = RADIUS.card,
  enterIndex,
  style,
  accessibilityLabel,
  testID,
  children,
}: CardProps) {
  const tint = accentTint(accent);
  const gradient = ACCENTS[accent].colors;

  let outer: ViewStyle;
  if (variant === "gradient") {
    outer = { borderRadius: radius, backgroundColor: gradient[1], ...coloredShadow(gradient[0], "md") };
  } else if (variant === "tinted") {
    outer = { borderRadius: radius, borderWidth: 1, borderColor: tint.border, backgroundColor: tint.soft, padding };
  } else {
    outer = {
      borderRadius: radius,
      borderWidth: 1,
      borderColor: COLORS.borderSoft,
      backgroundColor: COLORS.white,
      padding,
      ...SHADOWS[shadow],
    };
  }

  const inner =
    variant === "gradient" ? (
      <View style={{ borderRadius: radius, overflow: "hidden" }}>
        <LinearGradient colors={[gradient[0], gradient[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding }}>
          <View pointerEvents="none" style={{ position: "absolute", top: -30, right: -20, width: 110, height: 110, borderRadius: 55, backgroundColor: "rgba(255,255,255,0.10)" }} />
          <View pointerEvents="none" style={{ position: "absolute", bottom: -40, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.07)" }} />
          {children}
        </LinearGradient>
      </View>
    ) : (
      children
    );

  const card = onPress ? (
    <PressableScale onPress={onPress} activeScale={0.98} accessibilityLabel={accessibilityLabel} testID={testID} style={[outer, style]}>
      {inner}
    </PressableScale>
  ) : (
    <View accessibilityLabel={accessibilityLabel} testID={testID} style={[outer, style]}>
      {inner}
    </View>
  );

  return enterIndex === undefined ? card : <Enter index={enterIndex}>{card}</Enter>;
}
