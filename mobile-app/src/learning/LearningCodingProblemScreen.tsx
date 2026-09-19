import React, { useMemo } from "react";
import { Linking, ScrollView, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button } from "@/components/ui";
import { BackButton } from "@/components/learning/BackButton";
import { LearningScreen, PageContainer } from "@/components/learning/LearningScreen";
import { ReaderSkeleton } from "@/components/learning/reader/ReaderSkeleton";
import { ReaderLoading } from "@/components/learning/LearningSkeleton";
import { ErrorBlock, StateFrame } from "@/components/learning/LearningStates";
import { ReaderContent } from "@/components/learning/reader/ReaderContent";
import { AnchorRegistry, ReaderCtx } from "@/components/learning/reader/readerContext";
import { prepareTopic } from "@/learning/reader/readerModel";
import { notify } from "@/lib/notify";
import { useCodingProblem } from "@/hooks/useLearning";
import { codingProblemUrl } from "@/lib/compilerLink";
import { LAYOUT, RADII, SPACE, useTheme } from "@/theme";
import { alpha } from "@/theme/colorUtils";
import type { PlacementStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<PlacementStackParamList, "LearningCodingProblem">;
type Rte = RouteProp<PlacementStackParamList, "LearningCodingProblem">;

/**
 * Read-only Coding Problem detail. The mobile app never bundles a compiler / editor / run engine — code execution
 * happens on the CampusEduX website, reached via the "Solve on Website" button. Themed for Light / Dark / AMOLED.
 */
export function LearningCodingProblemScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { colors, type, accentFor, shadow, gutter } = useTheme();
  const { data, isLoading, isError, refetch } = useCodingProblem(params.slug);

  const accent = useMemo(() => accentFor({ slug: params.slug, name: "" }), [accentFor, params.slug]);
  const ctx = useMemo(() => ({ accent, anchors: new AnchorRegistry(), enableRun: false }), [accent]);
  // Problem statement is Markdown → same themed renderer as the reader (code blocks, tables, lists, inline code).
  const statement = useMemo(
    () => (data?.problem.description ? prepareTopic([{ id: "p", heading: "", body: data.problem.description, content_format: "markdown", file_url: null, video_url: null, metadata: {} }], "") : null),
    [data?.problem.description],
  );

  const goBack = () => navigation.goBack();
  const openWebsite = () => Linking.openURL(codingProblemUrl(params.slug)).catch(() => notify("Couldn't open the website"));
  const title = params.title ?? "Coding Problem";

  if (isLoading || isError || !data) {
    return (
      <LearningScreen>
        <StateFrame onBack={goBack} title={title}>
          {isLoading ? (
            <ReaderLoading>
              <ReaderSkeleton />
            </ReaderLoading>
          ) : isError ? (
            <ErrorBlock what="this problem" onRetry={() => refetch()} />
          ) : (
            <ErrorBlock title="This problem isn't available" message="It may have been unpublished or moved." onRetry={() => refetch()} />
          )}
        </StateFrame>
      </LearningScreen>
    );
  }

  const diffColor = data.problem.difficulty === "Easy" ? colors.success : data.problem.difficulty === "Hard" ? colors.danger : colors.warning;
  const Section = ({ heading, children }: { heading: string; children: React.ReactNode }) => (
    <View style={{ marginTop: SPACE[6] }}>
      <Text accessibilityRole="header" style={[type.h3, { color: colors.text, marginBottom: SPACE[3] }]}>
        {heading}
      </Text>
      {children}
    </View>
  );

  return (
    <Screen themed background="canvas">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACE[12] }}>
        <PageContainer maxWidth={LAYOUT.readingMaxWidth + gutter * 2} style={{ paddingTop: SPACE[2], paddingBottom: SPACE[3], flexDirection: "row", alignItems: "center", gap: SPACE[3] }}>
          <BackButton onPress={goBack} />
          <Text numberOfLines={1} style={[type.title, { color: colors.text, flex: 1 }]}>
            {title}
          </Text>
        </PageContainer>

        <PageContainer maxWidth={LAYOUT.readingMaxWidth + gutter * 2}>
          <Text style={[type.caption, { color: colors.textMuted }]}>💻 Coding Problem</Text>
          <Text accessibilityRole="header" style={[type.h1, { color: colors.text, marginTop: SPACE[1] }]}>
            {data.problem.title}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: SPACE[3], marginTop: SPACE[3] }}>
            <Text style={[type.label, { color: diffColor, fontFamily: type.title.fontFamily }]}>{data.problem.difficulty}</Text>
            {data.problem.supported_languages?.length ? <Text style={[type.small, { color: colors.textSecondary }]}>{data.problem.supported_languages.join(" · ")}</Text> : null}
            {data.problem.is_premium ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: SPACE[2], paddingVertical: 3, borderRadius: RADII.pill, backgroundColor: alpha(colors.warning, 0.16) }}>
                <Ionicons name="lock-closed" size={11} color={colors.warning} />
                <Text style={[type.caption, { color: colors.warning }]}>Premium</Text>
              </View>
            ) : null}
          </View>

          {data.locked ? (
            // Existing locked view — unchanged.
            <View className="border border-amber-200 bg-amber-50 rounded-2xl p-5 items-center mt-1 mb-5" style={{ marginTop: SPACE[5] }}>
              <Ionicons name="lock-closed" size={26} color="#B45309" />
              <Text className="text-amber-900 font-semibold mt-2 mb-1">Premium problem</Text>
              <Text className="text-amber-800 text-sm text-center mb-4">Upgrade to CampusEduX Premium to read this problem.</Text>
              <Button label="See Premium Plans" onPress={() => navigation.getParent()?.navigate("Premium", { screen: "PremiumPlans" })} className="w-full" />
            </View>
          ) : (
            <>
              {statement ? (
                <Section heading="Problem Statement">
                  <ReaderCtx.Provider value={ctx}>
                    <ReaderContent blocks={statement.blocks} />
                  </ReaderCtx.Provider>
                </Section>
              ) : null}

              {data.problem.examples?.length ? (
                <Section heading="Examples">
                  <View style={{ gap: SPACE[3] }}>
                    {data.problem.examples.map((ex, i) => (
                      <View key={i} style={[{ padding: SPACE[4], borderRadius: RADII.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 4 }, shadow("sm")]}>
                        <Text style={[type.title, { color: colors.text }]}>Example {i + 1}</Text>
                        {ex.input !== undefined ? <Text style={[type.small, { color: colors.textSecondary, fontSize: 14 }]}>Input: {ex.input || "(none)"}</Text> : null}
                        {ex.output !== undefined ? <Text style={[type.small, { color: colors.textSecondary, fontSize: 14 }]}>Output: {ex.output}</Text> : null}
                        {ex.explanation ? <Text style={[type.small, { color: colors.textMuted }]}>Explanation: {ex.explanation}</Text> : null}
                      </View>
                    ))}
                  </View>
                </Section>
              ) : null}

              {data.problem.constraints?.length ? (
                <Section heading="Constraints">
                  <View style={{ gap: SPACE[1] }}>
                    {data.problem.constraints.map((c, i) => (
                      <Text key={i} style={[type.small, { color: colors.textSecondary, fontSize: 14, lineHeight: 21 }]}>
                        • {c}
                      </Text>
                    ))}
                  </View>
                </Section>
              ) : null}

              {data.problem.hints?.length ? (
                <Section heading="Hints">
                  <View style={{ gap: SPACE[1] }}>
                    {data.problem.hints.map((h, i) => (
                      <Text key={i} style={[type.small, { color: colors.textSecondary, fontSize: 14, lineHeight: 21 }]}>
                        {i + 1}. {h}
                      </Text>
                    ))}
                  </View>
                </Section>
              ) : null}

              {data.solution_approach ? (
                <Section heading="Explanation">
                  <Text style={[type.small, { color: colors.textSecondary, fontSize: 14, lineHeight: 22 }]}>{data.solution_approach}</Text>
                </Section>
              ) : null}

              <View style={[{ marginTop: SPACE[6], padding: SPACE[4], borderRadius: RADII.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, shadow("sm")]}>
                <Text style={[type.small, { color: colors.textSecondary, textAlign: "center", marginBottom: SPACE[3], fontSize: 14 }]}>Code execution is available on the CampusEduX Website.</Text>
                <Button label="Solve on Website" leftIcon="open-outline" onPress={openWebsite} className="w-full" />
              </View>
            </>
          )}
        </PageContainer>
      </ScrollView>
    </Screen>
  );
}

export default LearningCodingProblemScreen;
