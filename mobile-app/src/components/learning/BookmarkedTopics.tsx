import React from "react";
import { Text, View } from "react-native";
import { useQueries } from "@tanstack/react-query";
import { useLearningBookmarks, learningQueryKeys } from "@/hooks/useLearning";
import { learningService } from "@/services/learning.service";
import { useAuthStore } from "@/store/authStore";
import { SPACE, useTheme } from "@/theme";
import type { LearningGridCard } from "@/types";
import { ListRowsSkeleton } from "./LearningSkeleton";
import { EmptyBlock, ErrorBlock } from "./LearningStates";
import { CourseBadge, TopicLinkRow } from "./SearchResults";

/**
 * "Bookmarked" filter. Bookmarks are stored per TOPIC, so the topic titles come
 * from the courses' trees (same query keys as the Course Detail screen → cached,
 * no new backend call). Taps use the normal topic navigation, so premium
 * gating is unchanged.
 */
export function BookmarkedTopics({
  grids,
  onOpenTopic,
}: {
  grids: LearningGridCard[];
  onOpenTopic: (gridSlug: string, gridName: string, topicSlug: string, topicTitle: string) => void;
}) {
  const { colors, type } = useTheme();
  const userId = useAuthStore((s) => s.user?.id);
  const bookmarks = useLearningBookmarks();
  const trees = useQueries({
    queries: grids.map((g) => ({
      queryKey: learningQueryKeys.tree(g.slug),
      queryFn: () => learningService.getTree(g.slug),
      enabled: !!userId && (bookmarks.data?.size ?? 0) > 0,
    })),
  });

  if (!userId) {
    return <EmptyBlock emoji="🔖" title="Sign in to see bookmarks" message="Your saved topics show up here once you're signed in." />;
  }
  if (bookmarks.isLoading || (bookmarks.data && bookmarks.data.size > 0 && trees.some((t) => t.isLoading))) return <ListRowsSkeleton />;
  if (bookmarks.isError) {
    return <ErrorBlock what="bookmarks" onRetry={() => bookmarks.refetch()} />;
  }

  const rows: { grid: LearningGridCard; sectionName: string; slug: string; title: string; premium: boolean }[] = [];
  trees.forEach((q, i) => {
    q.data?.sections.forEach((s) =>
      s.topics.forEach((t) => {
        if (bookmarks.data?.has(t.id)) rows.push({ grid: grids[i], sectionName: s.name, slug: t.slug, title: t.title, premium: t.is_premium });
      }),
    );
  });

  if (rows.length === 0) {
    return <EmptyBlock emoji="🔖" title="No bookmarks yet" message="Tap the bookmark icon on any topic to save it here for later." />;
  }
  return (
    <View style={{ gap: SPACE[3] }}>
      <Text style={[type.small, { color: colors.textSecondary }]}>
        {rows.length} bookmarked topic{rows.length === 1 ? "" : "s"}
      </Text>
      {rows.map((r, i) => (
        <TopicLinkRow
          key={`${r.grid.slug}/${r.slug}`}
          index={i}
          a11yLabel={`${r.title}, ${r.grid.name}, ${r.sectionName}${r.premium ? ", premium" : ""}`}
          badge={<CourseBadge name={r.grid.name} slug={r.grid.slug} accentColor={r.grid.accent_color} />}
          chapter={r.sectionName}
          premium={r.premium}
          title={<Text style={[type.title, { color: colors.text }]}>{r.title}</Text>}
          onPress={() => onOpenTopic(r.grid.slug, r.grid.name, r.slug, r.title)}
        />
      ))}
    </View>
  );
}
