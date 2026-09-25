import React, { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MOTION, RADII, SPACE, useTheme, type AccentTokens } from "@/theme";
import { useSettingsStore } from "@/store/settingsStore";
import type { ChapterView } from "@/learning/courseTree";
import { ProgressBar } from "./ProgressBar";

/**
 * Chapter header card for the Course Detail SectionList: number badge, title,
 * "X topics · Y done", per-chapter progress bar, animated chevron. When open,
 * its topic rows continue the same bordered card (see TopicRow).
 */
export const ChapterHeader = React.memo(function ChapterHeader({
  chapter,
  open,
  accent,
  onToggle,
}: {
  chapter: ChapterView;
  open: boolean;
  accent: AccentTokens;
  onToggle: (id: string) => void;
}) {
  const { colors, type } = useTheme();
  const reduce = useSettingsStore((s) => s.preferences.reduceAnimations);
  const rot = useRef(new Animated.Value(open ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) rot.setValue(open ? 1 : 0);
    else Animated.timing(rot, { toValue: open ? 1 : 0, duration: MOTION.accordion, useNativeDriver: true }).start();
  }, [open, reduce, rot]);

  const empty = chapter.total === 0;
  const expanded = open && !empty;
  const sub = empty ? "No topics yet" : `${chapter.total} topic${chapter.total === 1 ? "" : "s"}${chapter.done > 0 ? `  ·  ${chapter.done} done` : ""}`;
  const complete = chapter.total > 0 && chapter.done >= chapter.total;

  return (
    <Pressable
      onPress={() => onToggle(chapter.id)}
      disabled={empty}
      accessibilityRole="button"
      accessibilityState={{ expanded, disabled: empty }}
      accessibilityLabel={`Chapter ${chapter.index + 1}, ${chapter.name}, ${sub}, ${chapter.percent} percent complete`}
      accessibilityHint={empty ? undefined : expanded ? "Collapse chapter" : "Expand chapter"}
      style={({ pressed }) => ({
        minHeight: 76,
        padding: SPACE[4],
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE[3],
        backgroundColor: pressed ? colors.surfacePressed : colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderTopLeftRadius: RADII.xl,
        borderTopRightRadius: RADII.xl,
        borderBottomLeftRadius: expanded ? 0 : RADII.xl,
        borderBottomRightRadius: expanded ? 0 : RADII.xl,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: RADII.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: complete ? accent.base : accent.soft,
        }}
      >
        {complete ? (
          <Ionicons name="checkmark" size={22} color="#FFFFFF" />
        ) : (
          <Text style={[type.title, { color: accent.text }]}>{chapter.index + 1}</Text>
        )}
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={2} style={[type.title, { color: colors.text }]}>
          {chapter.name}
        </Text>
        <Text style={[type.small, { color: colors.textSecondary }]}>{sub}</Text>
        {!empty ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE[2], marginTop: SPACE[1] }}>
            <ProgressBar percent={chapter.percent} color={accent.base} height={5} style={{ flex: 1 }} />
            <Text style={[type.caption, { color: chapter.percent > 0 ? accent.text : colors.textMuted, minWidth: 30, textAlign: "right" }]}>{chapter.percent}%</Text>
          </View>
        ) : null}
      </View>

      {!empty ? (
        <Animated.View style={{ transform: [{ rotate: rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) }] }}>
          <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
        </Animated.View>
      ) : null}
    </Pressable>
  );
});
