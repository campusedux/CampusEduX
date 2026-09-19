import React, { useEffect, useRef } from "react";
import { Animated, View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import { RADII, SPACE, useTheme } from "@/theme";

/** Themed pulsing placeholder block (opacity loop — cheap, no gradient, light/dark aware). */
export function Skeleton({
  width = "100%",
  height = 14,
  radius = 8,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const v = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.skeleton, opacity: v }, style]}
    />
  );
}

/** Skeleton shaped like a course card, sized by the grid. */
export function CourseCardSkeleton({ width }: { width: number }) {
  const { colors, shadow } = useTheme();
  return (
    <View
      style={[
        { width, padding: SPACE[4], borderRadius: RADII.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, gap: SPACE[3] },
        shadow("sm"),
      ]}
    >
      <Skeleton width={56} height={56} radius={RADII.lg} />
      <Skeleton width="75%" height={18} />
      <Skeleton width="50%" height={13} />
      <Skeleton height={6} radius={6} />
    </View>
  );
}

/** Whole-Home loading state: hero + a grid of course cards. */
export function LearningHomeSkeleton({ cardWidth, count = 4 }: { cardWidth: number; count?: number }) {
  const { gutter } = useTheme();
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel="Loading courses" style={{ gap: SPACE[3] }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: gutter >= 24 ? SPACE[4] : SPACE[3] }}>
        {Array.from({ length: count }, (_, i) => (
          <CourseCardSkeleton key={i} width={cardWidth} />
        ))}
      </View>
    </View>
  );
}

/** Rows for search results / topic lists. */
export function ListRowsSkeleton({ count = 4 }: { count?: number }) {
  const { colors } = useTheme();
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel="Loading" style={{ gap: SPACE[3] }}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{ padding: SPACE[4], borderRadius: RADII.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, gap: SPACE[2] }}
        >
          <Skeleton width="65%" height={16} />
          <Skeleton width="40%" height={12} />
        </View>
      ))}
    </View>
  );
}
