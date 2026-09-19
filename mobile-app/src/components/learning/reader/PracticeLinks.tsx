import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "@/components/ui/PressableScale";
import { MOTION, RADII, SPACE, useTheme, type AccentTokens } from "@/theme";
import type { TopicCodingProblemCard, TopicMockTestCard, TopicPractice } from "@/types";

/**
 * Mock tests + coding problems that already exist for this topic (rendered only
 * when there are some). Tapping does exactly what it did before — the parent
 * supplies the handlers, including the premium redirect — this is styling only.
 */
export function PracticeLinks({
  practice,
  isPremiumUser,
  accent,
  onOpenMockTest,
  onOpenProblem,
}: {
  practice: TopicPractice | undefined;
  isPremiumUser: boolean;
  accent: AccentTokens;
  onOpenMockTest: (t: TopicMockTestCard) => void;
  onOpenProblem: (p: TopicCodingProblemCard) => void;
}) {
  const { colors, type, shadow } = useTheme();
  if (!practice || (practice.mock_tests.length === 0 && practice.coding_problems.length === 0)) return null;

  const Card = ({ icon, title, meta, cta, premium, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; meta: string; cta: string; premium: boolean; onPress: () => void }) => (
    <PressableScale
      onPress={onPress}
      activeScale={MOTION.pressedScale}
      accessibilityLabel={`${cta}: ${title}${premium ? ", premium" : ""}`}
      style={[{ minHeight: 72, padding: SPACE[4], borderRadius: RADII.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: SPACE[3] }, shadow("sm")]}
    >
      <View style={{ width: 44, height: 44, borderRadius: RADII.md, backgroundColor: accent.soft, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={22} color={accent.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={[type.title, { color: colors.text }]}>
          {title}
        </Text>
        <Text numberOfLines={1} style={[type.small, { color: colors.textSecondary, marginTop: 2 }]}>
          {meta}
        </Text>
      </View>
      {premium ? <Ionicons name="lock-closed" size={14} color={colors.warning} accessibilityLabel="Premium" /> : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </PressableScale>
  );

  return (
    <View style={{ gap: SPACE[3] }}>
      <Text accessibilityRole="header" style={[type.h3, { color: colors.text }]}>
        Practice this topic
      </Text>
      {practice.mock_tests.map((t) => (
        <Card
          key={t.id}
          icon="create-outline"
          title={t.title}
          meta={`Mock test · ${t.question_count} question${t.question_count === 1 ? "" : "s"}${t.duration_minutes ? ` · ${t.duration_minutes} min` : ""}${t.difficulty ? ` · ${t.difficulty}` : ""}`}
          cta="Start mock test"
          premium={t.is_premium && !isPremiumUser}
          onPress={() => onOpenMockTest(t)}
        />
      ))}
      {practice.coding_problems.map((p) => (
        <Card
          key={p.id}
          icon="code-slash-outline"
          title={p.title}
          meta={`Coding problem · ${p.difficulty}${p.supported_languages?.length ? ` · ${p.supported_languages.join(", ")}` : ""}`}
          cta="View problem"
          premium={p.is_premium && !isPremiumUser}
          onPress={() => onOpenProblem(p)}
        />
      ))}
    </View>
  );
}
