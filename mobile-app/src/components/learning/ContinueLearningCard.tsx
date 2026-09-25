import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { PressableScale } from "@/components/ui/PressableScale";
import { COURSE_ACCENTS, GRADIENT_SCRIM, MOTION, RADII, SPACE, TOUCH, accentTokens, useTheme } from "@/theme";
import { useLearningTree } from "@/hooks/useLearning";
import { completionPercent } from "@/learning/progress/progressLogic";
import { useCompletedCount, useLastOpened } from "@/learning/progress/progressStore";
import type { LearningGridCard } from "@/types";
import { ProgressBar } from "./ProgressBar";

const WHITE = "#FFFFFF";
const WHITE_SOFT = "rgba(255,255,255,0.92)";

/**
 * "Continue Learning" hero (replaces the old Stay Consistent banner). Shows the
 * last-opened topic, its course, "Chapter X · Topic", course-completion % and a
 * big Resume button. With no history it becomes a "Start learning" prompt.
 * Progress here is COURSE completion (completed / total topics), not scroll.
 */
export function ContinueLearningCard({
  grids,
  onResume,
  onExplore,
}: {
  grids: LearningGridCard[];
  onResume: (gridSlug: string, gridName: string, topicSlug: string, topicTitle: string) => void;
  onExplore: () => void;
}) {
  const { type, shadow, accentFor } = useTheme();
  const last = useLastOpened();
  const grid = last ? grids.find((g) => g.slug === last.gridSlug) : undefined;
  // Only resume a course that is still published; otherwise fall back to the start prompt.
  const resumable = last && grid ? last : null;

  const { data: tree } = useLearningTree(resumable?.gridSlug ?? "");
  const done = useCompletedCount(resumable?.gridSlug ?? "");

  const accent = resumable && grid ? accentFor({ slug: grid.slug, name: grid.name, accentColor: grid.accent_color }) : accentTokens(COURSE_ACCENTS.default, "light");

  const sectionIndex = resumable && tree ? tree.sections.findIndex((s) => s.topics.some((t) => t.slug === resumable.topicSlug)) : -1;
  const chapterLine =
    resumable && sectionIndex >= 0
      ? `Chapter ${sectionIndex + 1} · ${resumable.topicTitle}`
      : resumable
        ? resumable.topicTitle
        : "";
  const total = grid?.topic_count ?? 0;
  const pct = completionPercent(done, total);

  return (
    <View style={[{ borderRadius: RADII["2xl"], overflow: "hidden" }, shadow("md")]}>
      <LinearGradient colors={accent.gradient as unknown as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: SPACE[5] }}>
        <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: GRADIENT_SCRIM }} />
        {/* decorative soft circles */}
        <View pointerEvents="none" style={{ position: "absolute", right: -40, top: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(255,255,255,0.10)" }} />
        <View pointerEvents="none" style={{ position: "absolute", right: 40, bottom: -60, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.07)" }} />

        <Text style={[type.overline, { color: WHITE_SOFT }]}>{resumable ? "Continue learning" : "Start learning"}</Text>

        {resumable && grid ? (
          <>
            <Text numberOfLines={1} style={[type.h3, { color: WHITE, marginTop: SPACE[2] }]}>
              {grid.name}
            </Text>
            <Text numberOfLines={2} style={[type.body, { color: WHITE_SOFT, fontSize: 15, lineHeight: 22, marginTop: SPACE[1] }]}>
              {chapterLine}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE[3], marginTop: SPACE[4] }}>
              <ProgressBar percent={pct} color={WHITE} trackColor="rgba(255,255,255,0.28)" height={8} style={{ flex: 1 }} />
              <Text style={[type.label, { color: WHITE }]} accessibilityLabel={`${pct} percent of the course complete`}>
                {pct}%
              </Text>
            </View>
            <Text style={[type.small, { color: WHITE_SOFT, marginTop: SPACE[1] }]}>
              {done > 0 ? `${Math.min(done, total)} of ${total} topics completed` : "Course progress"}
            </Text>

            <PressableScale
              onPress={() => onResume(resumable.gridSlug, resumable.gridName, resumable.topicSlug, resumable.topicTitle)}
              activeScale={MOTION.pressedScale}
              accessibilityLabel={`Resume ${resumable.topicTitle}`}
              style={{
                marginTop: SPACE[5],
                minHeight: 52,
                borderRadius: RADII.lg,
                backgroundColor: WHITE,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: SPACE[2],
                paddingHorizontal: SPACE[6],
              }}
            >
              <Ionicons name="play" size={18} color={accent.gradient[1]} />
              <Text style={[type.button, { color: accent.gradient[1], fontSize: 16 }]}>Resume</Text>
            </PressableScale>
          </>
        ) : (
          <>
            <Text style={[type.h2, { color: WHITE, marginTop: SPACE[2] }]}>Pick a course and begin</Text>
            <Text style={[type.body, { color: WHITE_SOFT, fontSize: 15, lineHeight: 22, marginTop: SPACE[1] }]}>
              Short lessons, real examples, and a streak to keep you going.
            </Text>
            <PressableScale
              onPress={onExplore}
              activeScale={MOTION.pressedScale}
              accessibilityLabel="Explore courses"
              style={{
                marginTop: SPACE[5],
                minHeight: 52,
                minWidth: TOUCH.min,
                borderRadius: RADII.lg,
                backgroundColor: WHITE,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: SPACE[2],
                paddingHorizontal: SPACE[6],
              }}
            >
              <Text style={[type.button, { color: accent.gradient[1], fontSize: 16 }]}>Explore courses</Text>
              <Ionicons name="arrow-down" size={18} color={accent.gradient[1]} />
            </PressableScale>
          </>
        )}
      </LinearGradient>
    </View>
  );
}
