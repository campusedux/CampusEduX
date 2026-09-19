import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "@/components/ui/PressableScale";
import { RADII, SPACE, useTheme, type AccentTokens } from "@/theme";
import { useSettingsStore } from "@/store/settingsStore";

/**
 * "Mark as Complete ✓" — toggles. Completing plays a small check pop + ring
 * pulse (skipped with "Reduce animations"); tapping again undoes it.
 */
export function CompleteButton({ completed, onToggle, accent }: { completed: boolean; onToggle: () => void; accent: AccentTokens }) {
  const { colors, type } = useTheme();
  const reduce = useSettingsStore((s) => s.preferences.reduceAnimations);
  const pop = useRef(new Animated.Value(completed ? 1 : 0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!completed) {
      pop.setValue(0);
      return;
    }
    if (reduce) {
      pop.setValue(1);
      return;
    }
    pop.setValue(0);
    ring.setValue(0);
    Animated.parallel([
      Animated.spring(pop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }),
      Animated.timing(ring, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [completed, pop, ring, reduce]);

  const fill = accent.gradient[1];

  if (!completed) {
    return (
      <PressableScale
        onPress={onToggle}
        accessibilityLabel="Mark this topic as complete"
        style={{ minHeight: 56, borderRadius: RADII.lg, backgroundColor: fill, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACE[2], paddingHorizontal: SPACE[6] }}
      >
        <Text style={[type.button, { color: "#FFFFFF", fontSize: 16 }]}>Mark as Complete ✓</Text>
      </PressableScale>
    );
  }

  return (
    <PressableScale
      onPress={onToggle}
      accessibilityLabel="Topic completed. Tap to mark as not complete"
      accessibilityState={{ checked: true }}
      style={{ minHeight: 56, borderRadius: RADII.lg, backgroundColor: colors.successSoft, borderWidth: 1.5, borderColor: colors.success, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACE[3], paddingHorizontal: SPACE[5] }}
    >
      <View style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: 32,
            height: 32,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: colors.success,
            opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
            transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
          }}
        />
        <Animated.View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.success, alignItems: "center", justifyContent: "center", transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }}>
          <Ionicons name="checkmark" size={20} color={colors.scheme === "dark" ? "#0B0F19" : "#FFFFFF"} />
        </Animated.View>
      </View>
      <View>
        <Text style={[type.button, { color: colors.text }]}>Completed</Text>
        <Text style={[type.caption, { color: colors.textSecondary }]}>Tap to undo</Text>
      </View>
    </PressableScale>
  );
}
