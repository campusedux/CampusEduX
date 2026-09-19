import React, { useState } from "react";
import { Animated, View } from "react-native";
import { useTheme } from "@/theme";

/**
 * Thin reading-progress bar. `progress` is an Animated node (0–1) driven by the
 * scroll offset on the native thread — the bar moves without ever re-rendering
 * React, so it costs nothing while scrolling.
 */
export function ReadingProgressBar({ progress, color }: { progress: Animated.AnimatedDivision<number>; color: string }) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Reading progress"
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ height: 3, backgroundColor: colors.borderSoft, overflow: "hidden" }}
    >
      {w > 0 ? (
        <Animated.View
          style={{
            height: 3,
            width: w,
            backgroundColor: color,
            transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-w, 0], extrapolate: "clamp" }) }],
          }}
        />
      ) : null}
    </View>
  );
}
