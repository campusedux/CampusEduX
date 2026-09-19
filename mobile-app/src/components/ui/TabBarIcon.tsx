import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import { PressableScale } from "./PressableScale";

/** Tab icon with a soft pill behind it that fades/scales in when the tab is active. */
export function TabBarIcon({ name, focused, color }: { name: keyof typeof Ionicons.glyphMap; focused: boolean; color: string }) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(progress, { toValue: focused ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [focused, progress]);

  return (
    <View style={{ width: 56, height: 30, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: 56,
          height: 30,
          borderRadius: 15,
          backgroundColor: COLORS.primaryLight,
          opacity: progress,
          transform: [{ scaleX: progress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
        }}
      />
      <Ionicons name={focused ? name : (`${name}-outline` as any)} size={22} color={color} />
    </View>
  );
}

/** `tabBarButton` renderer: same button, plus PressableScale's subtle press feedback. */
export function TabBarButton(props: any) {
  const { onPress, onLongPress, accessibilityLabel, accessibilityState, testID, style, children } = props;
  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      activeScale={0.92}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      accessibilityRole="tab"
      testID={testID}
      style={style}
    >
      {children}
    </PressableScale>
  );
}
