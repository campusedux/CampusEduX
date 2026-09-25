import React, { useEffect, useRef } from "react";
import { Animated, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/theme";
import { useSettingsStore } from "@/store/settingsStore";

/** Thin, rounded progress bar. Fill animates on change (skipped with "Reduce animations"). */
export function ProgressBar({
  percent,
  color,
  trackColor,
  height = 6,
  style,
}: {
  percent: number;
  color: string;
  trackColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const reduce = useSettingsStore((s) => s.preferences.reduceAnimations);
  const pct = Math.max(0, Math.min(100, percent));
  const v = useRef(new Animated.Value(pct)).current;
  useEffect(() => {
    if (reduce) v.setValue(pct);
    else Animated.timing(v, { toValue: pct, duration: 420, useNativeDriver: false }).start();
  }, [pct, reduce, v]);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      style={[{ height, borderRadius: height, backgroundColor: trackColor ?? colors.border, overflow: "hidden" }, style]}
    >
      <Animated.View
        style={{
          height: "100%",
          borderRadius: height,
          backgroundColor: color,
          width: v.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
        }}
      />
    </View>
  );
}
