import React from "react";
import { Animated, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { PressableScale } from "@/components/ui";
import { withAlpha } from "@/constants/theme";
import { useEnterAnimation } from "./useEnterAnimation";

type IconName = keyof typeof Ionicons.glyphMap;

export { withAlpha };

const TILE_HEIGHT = 112;
const ICON_SIZE = 48;

/** Gradient icon square shared by the Category tiles and the Practice cards. */
export function GradientIcon({ icon, colors, size = ICON_SIZE }: { icon: IconName; colors: [string, string]; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        shadowColor: colors[1],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, borderRadius: 14, alignItems: "center", justifyContent: "center" }}
      >
        <Ionicons name={icon} size={24} color="#FFFFFF" />
      </LinearGradient>
    </View>
  );
}

/** Home-only Category tile: soft tint, 1px tinted border, gradient icon, optional NEW badge. */
export function HomeCategoryTile({
  label,
  icon,
  color,
  colors,
  badge,
  index = 0,
  onPress,
}: {
  label: string;
  icon: IconName;
  color: string;
  colors: [string, string];
  badge?: string;
  index?: number;
  onPress: () => void;
}) {
  const enterStyle = useEnterAnimation(index);
  return (
    <Animated.View style={[{ width: "31.5%", height: TILE_HEIGHT, marginBottom: 10 }, enterStyle]}>
      <PressableScale
        onPress={onPress}
        activeScale={0.95}
        accessibilityLabel={label}
        style={{
          flex: 1,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: withAlpha(color, 0.15),
          backgroundColor: withAlpha(color, 0.07),
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 6,
        }}
      >
        <GradientIcon icon={icon} colors={colors} />
        <View style={{ height: 34, marginTop: 8, justifyContent: "center" }}>
          <Text numberOfLines={2} style={{ color: "#111827", fontSize: 13, fontWeight: "600", textAlign: "center", lineHeight: 17 }}>
            {label}
          </Text>
        </View>
        {badge ? (
          <View
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              backgroundColor: "#0D9488",
              borderRadius: 999,
              paddingHorizontal: 6,
              paddingVertical: 2,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "700" }}>{badge}</Text>
          </View>
        ) : null}
      </PressableScale>
    </Animated.View>
  );
}
