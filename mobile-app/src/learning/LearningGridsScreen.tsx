import React, { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen } from "@/components/ui";
import { BackButton } from "@/components/learning/BackButton";
import { CourseCard } from "@/components/learning/CourseCard";
import { FadeInUp } from "@/components/learning/FadeInUp";
import { LearningHomeSkeleton } from "@/components/learning/LearningSkeleton";
import { PageContainer } from "@/components/learning/LearningScreen";
import { EmptyBlock, ErrorBlock } from "@/components/learning/LearningStates";
import { LearningSearchBar } from "@/components/learning/LearningSearchBar";
import { SearchResults } from "@/components/learning/SearchResults";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLearningGrids } from "@/hooks/useLearning";
import { SPACE, gridCardWidth, useTheme } from "@/theme";
import type { LearningSearchHit, PlacementStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<PlacementStackParamList, "LearningGrids">;

/**
 * Course list + global topic search (reached from the app Home "Learn" tile). Same data and navigation as before;
 * presentation now matches Learning Home (themed, shared cards / search results / states) and follows Light / Dark.
 */
export function LearningGridsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, type, width, wide, columns, gutter } = useTheme();
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search, 300);
  const grids = useLearningGrids();
  const searching = search.trim().length >= 2;
  const data = grids.data ?? [];

  const openGrid = useCallback((slug: string, name: string) => navigation.navigate("LearningGrid", { gridSlug: slug, gridName: name }), [navigation]);
  // Same destination as the normal topic list — the topic screen enforces the premium gate.
  const openHit = useCallback(
    (hit: LearningSearchHit) => navigation.navigate("LearningTopic", { gridSlug: hit.grid_slug, topicSlug: hit.topic_slug as string, topicTitle: hit.title }),
    [navigation],
  );

  const gap = wide ? SPACE[4] : SPACE[3];
  const cardWidth = gridCardWidth(width, gutter, columns, gap);

  let body: React.ReactNode;
  if (searching) {
    body = <SearchResults query={search} debouncedQuery={debounced} grids={data} onOpenTopic={openHit} onOpenGrid={openGrid} />;
  } else if (grids.isLoading) {
    body = <LearningHomeSkeleton cardWidth={cardWidth} count={columns * 2} />;
  } else if (grids.isError) {
    body = <ErrorBlock what="learning resources" onRetry={() => grids.refetch()} />;
  } else if (data.length === 0) {
    body = <EmptyBlock emoji="📚" title="No learning resources yet" message="New resources appear here as soon as they're published." />;
  } else {
    body = (
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap }}>
        {data.map((g, i) => (
          <FadeInUp key={g.id} index={i} style={{ width: cardWidth }}>
            <CourseCard grid={g} width={cardWidth} onPress={() => openGrid(g.slug, g.name)} />
          </FadeInUp>
        ))}
      </View>
    );
  }

  return (
    <Screen themed background="canvas">
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACE[10] }}>
        <PageContainer style={{ paddingTop: SPACE[2], paddingBottom: SPACE[3], flexDirection: "row", alignItems: "center", gap: SPACE[3] }}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text accessibilityRole="header" style={[type.h2, { color: colors.text, flex: 1 }]}>
            Learning
          </Text>
        </PageContainer>
        <PageContainer style={{ paddingBottom: SPACE[4] }}>
          <LearningSearchBar value={search} onChange={setSearch} filter="all" onFilter={() => undefined} showChips={false} />
        </PageContainer>
        <PageContainer>{body}</PageContainer>
      </ScrollView>
    </Screen>
  );
}

export default LearningGridsScreen;
