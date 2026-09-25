import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { PressableScale } from "@/components/ui/PressableScale";
import { GRADIENT_SCRIM, MOTION, RADII, SPACE, useTheme } from "@/theme";
import { alpha } from "@/theme/colorUtils";
import { completionPercent } from "@/learning/progress/progressLogic";
import { courseTags, estimateCourseTime, isEmoji } from "@/learning/learningFormat";
import { useCompletedCount } from "@/learning/progress/progressStore";
import type { LearningGridCard } from "@/types";
import { ProgressBar } from "./ProgressBar";

/**
 * Course tile for the Learning Home grid: accent-gradient icon tile, name,
 * "N topics · ~X hrs", data-backed tags (Popular / Premium), and course
 * completion. Press feedback is a 0.97 scale.
 */
export function CourseCard({ grid, width, onPress }: { grid: LearningGridCard; width: number; onPress: () => void }) {
  const { colors, type, shadow, accentFor } = useTheme();
  const accent = accentFor({ slug: grid.slug, name: grid.name, accentColor: grid.accent_color });
  const done = useCompletedCount(grid.slug);
  const total = grid.topic_count;
  const pct = completionPercent(done, total);
  const time = estimateCourseTime(total);
  const tags = courseTags(grid);

  const meta = [total > 0 ? `${total} topic${total === 1 ? "" : "s"}` : "Coming soon", time].filter(Boolean).join("  ·  ");
  const a11y = [
    grid.name,
    total > 0 ? `${total} topics` : "no topics yet",
    time ? `about ${time.replace("~", "")}` : null,
    total > 0 ? `${pct} percent complete` : null,
    ...tags.map((t) => t.label),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <PressableScale
      onPress={onPress}
      activeScale={MOTION.pressedScale}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={[
        {
          width,
          borderRadius: RADII.xl,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          padding: SPACE[4],
        },
        shadow("sm"),
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: SPACE[2] }}>
        <View style={{ width: 56, height: 56, borderRadius: RADII.lg, overflow: "hidden" }}>
          <LinearGradient colors={accent.gradient as unknown as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <View style={{ position: "absolute", inset: 0, backgroundColor: GRADIENT_SCRIM }} />
            {isEmoji(grid.icon) ? (
              <Text style={{ fontSize: 28 }}>{grid.icon}</Text>
            ) : (
              <Ionicons name={accent.icon} size={28} color={accent.onGradient} />
            )}
          </LinearGradient>
        </View>
        <View style={{ flexShrink: 1, alignItems: "flex-end", gap: SPACE[1] }}>
          {tags.map((t) => (
            <View
              key={t.label}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
                paddingHorizontal: SPACE[2],
                paddingVertical: 3,
                borderRadius: RADII.pill,
                backgroundColor: t.tone === "premium" ? alpha(colors.warning, 0.16) : accent.soft,
              }}
            >
              {t.tone === "premium" ? <Ionicons name="lock-closed" size={10} color={colors.warning} /> : null}
              <Text style={[type.caption, { color: t.tone === "premium" ? colors.warning : accent.text }]}>{t.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text numberOfLines={2} style={[type.title, { color: colors.text, marginTop: SPACE[3], minHeight: 44 }]}>
        {grid.name}
      </Text>
      <Text numberOfLines={1} style={[type.small, { color: colors.textSecondary, marginTop: SPACE[1] }]}>
        {meta}
      </Text>

      {total > 0 ? (
        <View style={{ marginTop: SPACE[3], flexDirection: "row", alignItems: "center", gap: SPACE[2] }}>
          <ProgressBar percent={pct} color={accent.base} style={{ flex: 1 }} />
          <Text style={[type.caption, { color: pct > 0 ? accent.text : colors.textMuted, minWidth: 32, textAlign: "right" }]}>{pct}%</Text>
        </View>
      ) : null}
    </PressableScale>
  );
}
