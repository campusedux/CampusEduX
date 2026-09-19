import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { PressableScale } from "@/components/ui/PressableScale";
import { GRADIENT_SCRIM, MOTION, RADII, SPACE, useTheme, type AccentTokens } from "@/theme";
import type { ResumeMode } from "@/learning/courseTree";
import { isEmoji } from "@/learning/learningFormat";
import { BackButton } from "./BackButton";
import { ProgressBar } from "./ProgressBar";

const WHITE = "#FFFFFF";
const WHITE_SOFT = "rgba(255,255,255,0.92)";

const CTA: Record<ResumeMode, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  start: { label: "Start course", icon: "play" },
  continue: { label: "Continue", icon: "play" },
  review: { label: "Review course", icon: "refresh" },
};

/**
 * Course Detail hero: accent gradient, icon tile, title, one-line description,
 * chapter/topic counts + approximate total time, overall course progress and a
 * Start / Continue button. The gradient carries a scrim so all small white
 * text is AA on every course colour.
 */
export function CourseHero({
  title,
  description,
  icon,
  accent,
  chapterCount,
  topicCount,
  timeLabel,
  done,
  percent,
  mode,
  onBack,
  onCta,
}: {
  title: string;
  description?: string | null;
  icon?: string | null;
  accent: AccentTokens;
  chapterCount: number;
  topicCount: number;
  /** "~3 hrs" or null (hidden). */
  timeLabel: string | null;
  done: number;
  percent: number;
  /** null → no topics, hide the button. */
  mode: ResumeMode | null;
  onBack: () => void;
  onCta: () => void;
}) {
  const { type, shadow } = useTheme();
  const stats = [
    { icon: "albums-outline" as const, text: `${chapterCount} chapter${chapterCount === 1 ? "" : "s"}` },
    { icon: "document-text-outline" as const, text: `${topicCount} topic${topicCount === 1 ? "" : "s"}` },
    ...(timeLabel ? [{ icon: "time-outline" as const, text: timeLabel }] : []),
  ];
  const cta = mode ? CTA[mode] : null;

  return (
    <View style={[{ borderRadius: RADII["2xl"], overflow: "hidden" }, shadow("md")]}>
      <LinearGradient colors={accent.gradient as unknown as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: SPACE[5] }}>
        <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: GRADIENT_SCRIM }} />
        <View pointerEvents="none" style={{ position: "absolute", right: -50, top: -50, width: 190, height: 190, borderRadius: 95, backgroundColor: "rgba(255,255,255,0.10)" }} />
        <View pointerEvents="none" style={{ position: "absolute", right: 60, bottom: -70, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.07)" }} />

        <View style={{ marginLeft: -SPACE[1], marginBottom: SPACE[3], alignSelf: "flex-start" }}>
          <BackButton onPress={onBack} onGradient />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE[4] }}>
          <View style={{ width: 64, height: 64, borderRadius: RADII.xl, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
            {isEmoji(icon) ? <Text style={{ fontSize: 32 }}>{icon}</Text> : <Ionicons name={accent.icon} size={32} color={WHITE} />}
          </View>
          <Text numberOfLines={3} accessibilityRole="header" style={[type.h1, { color: WHITE, flex: 1 }]}>
            {title}
          </Text>
        </View>

        {description ? (
          <Text numberOfLines={2} style={[type.body, { color: WHITE_SOFT, fontSize: 15, lineHeight: 22, marginTop: SPACE[3] }]}>
            {description}
          </Text>
        ) : null}

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACE[2], marginTop: SPACE[4] }}>
          {stats.map((s) => (
            <View
              key={s.text}
              style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: SPACE[3], paddingVertical: 5, borderRadius: RADII.pill, backgroundColor: "rgba(255,255,255,0.18)" }}
            >
              <Ionicons name={s.icon} size={14} color={WHITE} />
              <Text style={[type.label, { color: WHITE, fontSize: 13 }]}>{s.text}</Text>
            </View>
          ))}
        </View>

        {topicCount > 0 ? (
          <View style={{ marginTop: SPACE[5] }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE[3] }}>
              <ProgressBar percent={percent} color={WHITE} trackColor="rgba(255,255,255,0.28)" height={8} style={{ flex: 1 }} />
              <Text style={[type.label, { color: WHITE }]} accessibilityLabel={`${percent} percent of the course complete`}>
                {percent}%
              </Text>
            </View>
            <Text style={[type.small, { color: WHITE_SOFT, marginTop: SPACE[1] }]}>
              {done > 0 ? `${done} of ${topicCount} topics completed` : "Not started yet"}
            </Text>
          </View>
        ) : null}

        {cta ? (
          <PressableScale
            onPress={onCta}
            activeScale={MOTION.pressedScale}
            accessibilityLabel={cta.label}
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
            <Ionicons name={cta.icon} size={18} color={accent.gradient[1]} />
            <Text style={[type.button, { color: accent.gradient[1], fontSize: 16 }]}>{cta.label}</Text>
          </PressableScale>
        ) : null}
      </LinearGradient>
    </View>
  );
}
