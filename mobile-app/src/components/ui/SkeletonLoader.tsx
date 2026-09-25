import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Animated, Easing, View, DimensionValue, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, RADIUS } from "@/constants/theme";

const BASE = "#ECEEF4";

/** One shared 0→1 loop per group so a whole list shimmers in sync with a single animation. */
const ShimmerContext = createContext<Animated.Value | null>(null);

function useLoop() {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(value, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [value]);
  return value;
}

/** Provides one shimmer clock to every <Skeleton> inside it. */
export function SkeletonGroup({ children }: { children: React.ReactNode }) {
  const value = useLoop();
  return <ShimmerContext.Provider value={value}>{children}</ShimmerContext.Provider>;
}

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** A single shimmering placeholder block. Wrap several in <SkeletonGroup> (the presets do). */
export function Skeleton({ width = "100%", height = 14, radius = 8, style }: SkeletonProps) {
  const shared = useContext(ShimmerContext);
  const [w, setW] = useState(0);
  const translateX = shared?.interpolate({ inputRange: [0, 1], outputRange: [-w, w] });

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={[{ width, height, borderRadius: radius, backgroundColor: BASE, overflow: "hidden" }, style]}
    >
      {shared && w > 0 ? (
        <Animated.View style={{ ...absFill, width: w, transform: [{ translateX: translateX! }] }}>
          <LinearGradient
            colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.65)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const absFill = { position: "absolute", top: 0, bottom: 0, left: 0 } as const;

/** Placeholder shaped like a list card: thumbnail + title + two meta lines. */
export function SkeletonCard() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        marginBottom: 12,
        gap: 12,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.borderSoft,
        backgroundColor: COLORS.white,
      }}
    >
      <Skeleton width={64} height={64} radius={14} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="45%" height={12} />
        <Skeleton width="30%" height={12} />
      </View>
    </View>
  );
}

/** Placeholder for a simple text row (settings / list rows). */
export function SkeletonRow() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56 }}>
      <Skeleton width={40} height={40} radius={12} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="55%" height={14} />
        <Skeleton width="35%" height={12} />
      </View>
    </View>
  );
}

/** Placeholder for a hero / gradient card. */
export function SkeletonHero({ height = 140 }: { height?: number }) {
  return <Skeleton height={height} radius={RADIUS.card} style={{ marginBottom: 16 }} />;
}

interface SkeletonListProps {
  count?: number;
  variant?: "card" | "row";
  /** Adds a hero placeholder above the list. */
  hero?: boolean;
}

/**
 * Drop-in replacement for a full-screen spinner: shimmering placeholders
 * shaped like the list that is about to appear. One animation drives all.
 */
export function SkeletonList({ count = 5, variant = "card", hero }: SkeletonListProps) {
  return (
    <SkeletonGroup>
      <View accessible accessibilityRole="progressbar" accessibilityLabel="Loading">
        {hero ? <SkeletonHero /> : null}
        {Array.from({ length: count }, (_, i) => (variant === "card" ? <SkeletonCard key={i} /> : <SkeletonRow key={i} />))}
      </View>
    </SkeletonGroup>
  );
}

/** Convenience default: the general-purpose loader. */
export function SkeletonLoader(props: SkeletonListProps) {
  return <SkeletonList {...props} />;
}
