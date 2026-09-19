import React, { useEffect, useRef } from "react";
import { Animated, type StyleProp, type ViewStyle } from "react-native";
import { MOTION } from "@/theme";
import { useSettingsStore } from "@/store/settingsStore";

/**
 * Subtle entrance (fade + 14px slide up, 260ms) with a capped stagger so a long
 * list never delays its last row. Honours the app's "Reduce animations" setting.
 */
export function FadeInUp({
  index = 0,
  children,
  style,
}: {
  index?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduce = useSettingsStore((s) => s.preferences.reduceAnimations);
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) return;
    Animated.timing(v, {
      toValue: 1,
      duration: MOTION.enter,
      delay: Math.min(index, MOTION.maxStaggerIndex) * MOTION.stagger,
      useNativeDriver: true,
    }).start();
  }, [v, index, reduce]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [MOTION.enterOffset, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
