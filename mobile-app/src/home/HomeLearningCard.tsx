import React, { useEffect, useRef } from "react";
import { Animated, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { PressableScale } from "@/components/ui";
import type { LearningGridCard } from "@/types";

/** Card width on phones; the next card peeks because the screen is narrower than two cards. */
export const HOME_LEARNING_CARD_WIDTH = 280;
export const HOME_LEARNING_CARD_GAP = 16;
const CARD_HEIGHT = 184;
const CARD_RADIUS = 20;
const PRIMARY = "#4F39F6";

type IconName = keyof typeof Ionicons.glyphMap;

export interface CourseIdentity {
  icon: IconName;
  /** Diagonal gradient, light → dark. Dark enough end for white text. */
  colors: [string, string];
  /** The course's own emoji icon, shown in the glass square instead of `icon`. */
  emoji: string | null;
}

const DEFAULT_COLORS: [string, string] = ["#6366F1", "#4338CA"];

/** Keyword → identity, checked in order against `slug + name` (lower-cased). */
const KEYWORD_IDENTITIES: { test: RegExp; icon: IconName; colors: [string, string] }[] = [
  { test: /\b(ai|ml)\b|machine[- ]?learning|artificial|deep[- ]?learning/, icon: "hardware-chip-outline", colors: ["#8B5CF6", "#5B21B6"] },
  { test: /dbms|sql|database/, icon: "server-outline", colors: ["#2563EB", "#1E3A8A"] },
  { test: /java(?!script)/, icon: "cafe-outline", colors: ["#F97316", "#C2410C"] },
  { test: /python/, icon: "logo-python", colors: ["#10B981", "#047857"] },
];

const HEX6 = /^#[0-9a-f]{6}$/i;

function isEmoji(s: string | null): s is string {
  return !!s && /\p{Extended_Pictographic}/u.test(s);
}

/** Darkens a #RRGGBB colour by `amount` (0-1) toward black. */
function darken(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) =>
    Math.round(((n >> shift) & 255) * (1 - amount))
      .toString(16)
      .padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}

/** Uses the course's own accent/icon when set, otherwise maps by keyword, otherwise a default. */
export function getCourseIdentity(grid: Pick<LearningGridCard, "name" | "slug" | "icon" | "accent_color">): CourseIdentity {
  const hay = `${grid.slug} ${grid.name}`.toLowerCase();
  const match = KEYWORD_IDENTITIES.find((k) => k.test.test(hay));
  const own = grid.accent_color && HEX6.test(grid.accent_color) ? grid.accent_color : null;
  return {
    icon: match?.icon ?? "book-outline",
    colors: own ? [own, darken(own, 0.4)] : match?.colors ?? DEFAULT_COLORS,
    emoji: isEmoji(grid.icon) ? grid.icon : null,
  };
}

/**
 * Home-only Learning course card: full diagonal-gradient tile with a faded
 * watermark icon, decorative circles, glass icon/pill and a round CTA button.
 * The app stores no per-course progress, so no progress bar is shown.
 */
export function HomeLearningCard({
  grid,
  index = 0,
  onPress,
}: {
  grid: LearningGridCard;
  index?: number;
  onPress: () => void;
}) {
  const { icon, colors, emoji } = getCourseIdentity(grid);
  const topicLabel = `${grid.topic_count} Topic${grid.topic_count === 1 ? "" : "s"}`;

  // Subtle entrance: fade + slide up, staggered 80ms per card, 320ms each.
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 320, delay: index * 80, useNativeDriver: true }).start();
  }, [enter, index]);

  return (
    <Animated.View
      style={{
        width: HOME_LEARNING_CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: CARD_RADIUS,
        // Coloured, soft, wide shadow (kept off the clipped inner view so iOS renders it).
        shadowColor: colors[0],
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
        opacity: enter,
        transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
      }}
    >
      <PressableScale onPress={onPress} style={{ flex: 1, borderRadius: CARD_RADIUS, overflow: "hidden" }}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, padding: 14 }}>
          {/* Faint scrim keeps white text readable on the lighter gradient starts (orange/green). */}
          <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.1)" }} />
          {/* Decoration */}
          <View pointerEvents="none" style={{ position: "absolute", top: -40, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.12)" }} />
          <View pointerEvents="none" style={{ position: "absolute", top: 20, right: 34, width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.08)" }} />
          <View pointerEvents="none" style={{ position: "absolute", right: -22, bottom: -24, opacity: 0.15 }}>
            <Ionicons name={icon} size={110} color="#FFFFFF" />
          </View>

          <View style={{ flex: 1, justifyContent: "space-between" }}>
            <View>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                {emoji ? <Text style={{ fontSize: 22 }}>{emoji}</Text> : <Ionicons name={icon} size={24} color="#FFFFFF" />}
              </View>
              <Text numberOfLines={1} style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700", marginTop: 8 }}>
                {grid.name}
              </Text>
              <Text numberOfLines={2} style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 2 }}>
                {grid.description}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Ionicons name="book-outline" size={13} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "600", marginLeft: 5 }}>{topicLabel}</Text>
              </View>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="arrow-forward" size={18} color={colors[1]} />
              </View>
            </View>
          </View>
        </LinearGradient>
      </PressableScale>
    </Animated.View>
  );
}

/** Pagination dots for the carousel; the active dot is wider and uses the primary colour. */
export function HomeLearningDots({ count, active }: { count: number; active: number }) {
  if (count < 2) return null;
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 4, marginBottom: 8 }}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            height: 6,
            width: i === active ? 18 : 6,
            borderRadius: 3,
            marginHorizontal: 3,
            backgroundColor: i === active ? PRIMARY : "#D1D5DB",
          }}
        />
      ))}
    </View>
  );
}
