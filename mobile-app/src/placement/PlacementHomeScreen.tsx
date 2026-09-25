import React, { useCallback, useRef, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DrawerMenuButton } from "@/components/ui";
import { BookmarkedTopics } from "@/components/learning/BookmarkedTopics";
import { ContinueLearningCard } from "@/components/learning/ContinueLearningCard";
import { CourseCard } from "@/components/learning/CourseCard";
import { FadeInUp } from "@/components/learning/FadeInUp";
import { LearningHomeSkeleton, Skeleton } from "@/components/learning/LearningSkeleton";
import { LearningScreen, PageContainer } from "@/components/learning/LearningScreen";
import { EmptyBlock, ErrorBlock } from "@/components/learning/LearningStates";
import { LearningSearchBar } from "@/components/learning/LearningSearchBar";
import { SearchResults } from "@/components/learning/SearchResults";
import { StreakPill } from "@/components/learning/StreakPill";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLearningGrids } from "@/hooks/useLearning";
import { firstName, matchesCourseFilter, type CourseFilter } from "@/learning/learningFormat";
import { useCompletedByGrid, useStreak } from "@/learning/progress/progressStore";
import { useAuthStore } from "@/store/authStore";
import { RADII, SPACE, gridCardWidth, useTheme } from "@/theme";
import type { LearningGridCard, LearningSearchHit, PlacementStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<PlacementStackParamList, "PlacementHome">;

const SEARCH_DEBOUNCE_MS = 300;

/**
 * The "Learning" home (bottom-tab "Prep" — internal route name kept for deep
 * links). The course list is 100% DB-driven via `learning_grids_list('mobile')`;
 * a grid published from the admin panel appears on the next refresh with no app
 * update. Every course opens the same Grid → Section → Topic → Content tree.
 * Presentation only: queries, routes and access checks are unchanged.
 *
 * Layout: greeting + streak → Continue Learning hero → STICKY search + filter
 * chips → course grid (1 / 2 / 3 columns) or inline search / bookmarks results.
 */
export function PlacementHomeScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const { colors, type, width, wide, columns, gutter } = useTheme();
  const grids = useLearningGrids();
  const streak = useStreak();
  const completedByGrid = useCompletedByGrid();

  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [filter, setFilter] = useState<CourseFilter>("all");
  const searching = query.trim().length >= 2;

  const scrollRef = useRef<ScrollView>(null);
  const contentY = useRef(0);

  const openGrid = useCallback(
    (slug: string, name: string) => navigation.navigate("LearningGrid", { gridSlug: slug, gridName: name }),
    [navigation],
  );
  // Same destination as the normal topic list: the topic screen enforces the premium gate.
  const openTopic = useCallback(
    (gridSlug: string, _gridName: string, topicSlug: string, topicTitle: string) =>
      navigation.navigate("LearningTopic", { gridSlug, topicSlug, topicTitle }),
    [navigation],
  );
  const openHit = useCallback(
    (hit: LearningSearchHit) => openTopic(hit.grid_slug, hit.grid_name, hit.topic_slug as string, hit.title),
    [openTopic],
  );

  const data: LearningGridCard[] = grids.data ?? [];
  const visible = data.filter((g) => matchesCourseFilter(filter, completedByGrid[g.slug] ?? 0, g.topic_count));

  const gap = wide ? SPACE[4] : SPACE[3];
  const cardWidth = gridCardWidth(width, gutter, columns, gap);

  const filterEmpty: Record<Exclude<CourseFilter, "all" | "bookmarked">, { emoji: string; title: string; message: string }> = {
    "in-progress": { emoji: "📖", title: "Nothing in progress", message: "Open any course and finish a topic — it will show up here." },
    completed: { emoji: "🏆", title: "No completed courses yet", message: "Finish every topic in a course to see it here." },
  };

  let body: React.ReactNode;
  if (searching) {
    body = (
      <SearchResults query={query} debouncedQuery={debounced} grids={data} onOpenTopic={openHit} onOpenGrid={openGrid} />
    );
  } else if (filter === "bookmarked") {
    body = <BookmarkedTopics grids={data} onOpenTopic={openTopic} />;
  } else if (grids.isLoading) {
    body = <LearningHomeSkeleton cardWidth={cardWidth} count={columns * 2} />;
  } else if (grids.isError) {
    body = <ErrorBlock what="courses" onRetry={() => grids.refetch()} />;
  } else if (data.length === 0) {
    body = <EmptyBlock emoji="🎓" title="Nothing here yet" message="Courses appear here as soon as they're published from the admin panel." />;
  } else if (visible.length === 0 && filter !== "all") {
    body = <EmptyBlock {...filterEmpty[filter]} />;
  } else {
    body = (
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap }}>
        {visible.map((g, i) => (
          <FadeInUp key={g.id} index={i} style={{ width: cardWidth }}>
            <CourseCard grid={g} width={cardWidth} onPress={() => openGrid(g.slug, g.name)} />
          </FadeInUp>
        ))}
      </View>
    );
  }

  return (
    <LearningScreen>
      <ScrollView
        ref={scrollRef}
        stickyHeaderIndices={[1]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SPACE[10] }}
        refreshControl={<RefreshControl refreshing={grids.isRefetching} onRefresh={() => grids.refetch()} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        {/* 0 — greeting + Continue Learning (scrolls away) */}
        <PageContainer style={{ paddingTop: SPACE[2], paddingBottom: SPACE[4] }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE[3], marginBottom: SPACE[4] }}>
            <DrawerMenuButton color={colors.text} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={[type.h2, { color: colors.text }]}>
                Hi {firstName(user?.fullName)} 👋
              </Text>
              <Text numberOfLines={1} style={[type.small, { color: colors.textSecondary, marginTop: 2 }]}>
                Let&apos;s keep learning today
              </Text>
            </View>
            <StreakPill days={streak} />
          </View>

          {grids.isLoading ? (
            <Skeleton height={210} radius={RADII["2xl"]} />
          ) : (
            <ContinueLearningCard
              grids={data}
              onResume={openTopic}
              onExplore={() => scrollRef.current?.scrollTo({ y: Math.max(0, contentY.current - 8), animated: true })}
            />
          )}
        </PageContainer>

        {/* 1 — sticky search + filters (opaque so cards scroll cleanly beneath) */}
        <View style={{ backgroundColor: colors.canvas }}>
          <PageContainer style={{ paddingTop: SPACE[2], paddingBottom: SPACE[3] }}>
            <LearningSearchBar value={query} onChange={setQuery} filter={filter} onFilter={setFilter} showChips={!searching} />
          </PageContainer>
        </View>

        {/* 2 — results / course grid */}
        <View onLayout={(e) => (contentY.current = e.nativeEvent.layout.y)}>
          <PageContainer style={{ paddingTop: SPACE[1] }}>
            {!searching && filter === "all" && data.length > 0 ? (
              <Text style={[type.h3, { color: colors.text, marginBottom: SPACE[3] }]} accessibilityRole="header">
                Explore courses
              </Text>
            ) : null}
            {body}
          </PageContainer>
        </View>
      </ScrollView>
    </LearningScreen>
  );
}

export default PlacementHomeScreen;
