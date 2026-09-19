import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "@/components/ui/PressableScale";
import { TOUCH, useTheme } from "@/theme";

/** 44×44 back button. `onGradient` gives it a translucent white disc for use on a hero. */
export function BackButton({ onPress, onGradient }: { onPress: () => void; onGradient?: boolean }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      activeScale={0.92}
      accessibilityLabel="Go back"
      style={{
        width: TOUCH.min,
        height: TOUCH.min,
        borderRadius: TOUCH.min / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: onGradient ? "rgba(255,255,255,0.2)" : colors.surface,
        borderWidth: onGradient ? 0 : 1,
        borderColor: colors.border,
      }}
    >
      <Ionicons name="arrow-back" size={22} color={onGradient ? "#FFFFFF" : colors.text} />
    </PressableScale>
  );
}
