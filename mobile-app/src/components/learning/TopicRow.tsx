import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RADII, SPACE, TOUCH, useTheme, type AccentTokens } from "@/theme";
import type { LearningTopicRef } from "@/types";
import { FadeInUp } from "./FadeInUp";

/**
 * One topic inside an open chapter (continues the chapter card's borders).
 *  - numbered circle → ✓ filled circle when completed
 *  - title (16 semibold) + up to 2 description lines (wraps at word boundaries)
 *  - lock icon for premium (hint only; the reader enforces the gate)
 *  - bookmark toggle (44px target, shown only when signed in)
 *  - the in-progress topic gets an accent tint + left bar + "Continue" tag
 *  - min height 56 with a pressed state
 * No per-topic time is shown (would be inaccurate).
 */
export const TopicRow = React.memo(function TopicRow({
  topic,
  number,
  isFirst,
  isLast,
  completed,
  current,
  bookmarked,
  canBookmark,
  accent,
  animateIndex,
  onOpen,
  onToggleBookmark,
}: {
  topic: LearningTopicRef;
  /** 1-based position inside the chapter. */
  number: number;
  isFirst: boolean;
  isLast: boolean;
  completed: boolean;
  current: boolean;
  bookmarked: boolean;
  canBookmark: boolean;
  accent: AccentTokens;
  /** Set only for rows of a just-expanded chapter → staggered fade-in. */
  animateIndex?: number;
  onOpen: (topic: LearningTopicRef) => void;
  onToggleBookmark: (topic: LearningTopicRef, isBookmarked: boolean) => void;
}) {
  const { colors, type } = useTheme();

  const status = completed ? "completed" : current ? "in progress" : "not started";
  const a11y = `Topic ${number}, ${topic.title}, ${status}${topic.is_premium ? ", premium" : ""}`;

  const content = (
    <View style={{ flexDirection: "row", alignItems: "stretch" }}>
      <Pressable
        onPress={() => onOpen(topic)}
        accessibilityRole="button"
        accessibilityLabel={a11y}
        style={({ pressed }) => ({
          flex: 1,
          minHeight: TOUCH.row,
          flexDirection: "row",
          alignItems: "center",
          gap: SPACE[3],
          paddingVertical: SPACE[3],
          paddingLeft: SPACE[4],
          paddingRight: canBookmark ? SPACE[1] : SPACE[4],
          backgroundColor: pressed ? colors.surfacePressed : "transparent",
        })}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: completed ? accent.base : current ? "transparent" : accent.soft,
            borderWidth: current && !completed ? 2 : 0,
            borderColor: accent.base,
          }}
        >
          {completed ? (
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          ) : current ? (
            <Ionicons name="play" size={13} color={accent.text} style={{ marginLeft: 1 }} />
          ) : (
            <Text style={[type.label, { color: accent.text, fontFamily: type.title.fontFamily }]}>{number}</Text>
          )}
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[type.title, { color: colors.text }]} numberOfLines={2}>
            {topic.title}
          </Text>
          {topic.short_description ? (
            <Text style={[type.small, { color: colors.textSecondary }]} numberOfLines={2}>
              {topic.short_description}
            </Text>
          ) : null}
          {current && !completed ? (
            <Text style={[type.caption, { color: accent.text, marginTop: 2 }]}>Continue from here</Text>
          ) : null}
        </View>

        {topic.is_premium ? <Ionicons name="lock-closed" size={14} color={colors.warning} accessibilityLabel="Premium" /> : null}
      </Pressable>

      {canBookmark ? (
        <Pressable
          onPress={() => onToggleBookmark(topic, bookmarked)}
          accessibilityRole="button"
          accessibilityLabel={bookmarked ? `Remove bookmark from ${topic.title}` : `Bookmark ${topic.title}`}
          accessibilityState={{ selected: bookmarked }}
          style={({ pressed }) => ({
            width: TOUCH.min,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? colors.surfacePressed : "transparent",
          })}
        >
          <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={20} color={bookmarked ? accent.text : colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View
      style={{
        backgroundColor: current && !completed ? accent.soft : colors.surface,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: colors.border,
        borderTopWidth: isFirst ? 0 : 1,
        borderTopColor: colors.borderSoft,
        ...(isLast
          ? { borderBottomWidth: 1, borderBottomLeftRadius: RADII.xl, borderBottomRightRadius: RADII.xl, overflow: "hidden" as const }
          : null),
      }}
    >
      {current && !completed ? <View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, backgroundColor: accent.base }} /> : null}
      <FadeInUp index={animateIndex ?? 0} enabled={animateIndex !== undefined}>
        {content}
      </FadeInUp>
    </View>
  );
});
