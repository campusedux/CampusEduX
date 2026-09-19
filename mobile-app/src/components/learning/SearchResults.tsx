import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "@/components/ui/PressableScale";
import { MOTION, RADII, SPACE, useTheme } from "@/theme";
import { useLearningSearch } from "@/hooks/useLearning";
import { splitHighlight } from "@/learning/learningFormat";
import type { LearningGridCard, LearningSearchHit } from "@/types";
import { FadeInUp } from "./FadeInUp";
import { ListRowsSkeleton } from "./LearningSkeleton";
import { StateBlock } from "./LearningStates";

/** Text with the matched words tinted + bold. */
export function HighlightedText({ text, query, style, numberOfLines }: { text: string; query: string; style: any; numberOfLines?: number }) {
  const { colors, type } = useTheme();
  return (
    <Text numberOfLines={numberOfLines} style={style}>
      {splitHighlight(text, query).map((seg, i) =>
        seg.match ? (
          <Text key={i} style={{ fontFamily: type.title.fontFamily, color: colors.text, backgroundColor: colors.primarySoft }}>
            {seg.text}
          </Text>
        ) : (
          seg.text
        ),
      )}
    </Text>
  );
}

/** Small course-coloured pill (course name in its accent). */
export function CourseBadge({ name, slug, accentColor }: { name: string; slug: string; accentColor?: string | null }) {
  const { type, accentFor } = useTheme();
  const a = accentFor({ slug, name, accentColor });
  return (
    <View style={{ alignSelf: "flex-start", maxWidth: "100%", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: SPACE[2], paddingVertical: 3, borderRadius: RADII.pill, backgroundColor: a.soft }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: a.base }} />
      <Text numberOfLines={1} style={[type.caption, { color: a.text, flexShrink: 1 }]}>
        {name}
      </Text>
    </View>
  );
}

/** One tappable topic/course row (search hit or bookmark). */
export function TopicLinkRow({
  index,
  badge,
  chapter,
  title,
  snippet,
  premium,
  onPress,
  a11yLabel,
}: {
  index: number;
  badge: React.ReactNode;
  chapter?: string | null;
  title: React.ReactNode;
  snippet?: React.ReactNode;
  premium?: boolean;
  onPress: () => void;
  a11yLabel: string;
}) {
  const { colors, type, shadow } = useTheme();
  return (
    <FadeInUp index={index}>
      <PressableScale
        onPress={onPress}
        activeScale={MOTION.pressedScale}
        accessibilityLabel={a11yLabel}
        style={[
          { minHeight: 56, padding: SPACE[4], borderRadius: RADII.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, gap: SPACE[2] },
          shadow("sm"),
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE[2] }}>
          <View style={{ flexShrink: 1 }}>{badge}</View>
          {chapter ? (
            <Text numberOfLines={1} style={[type.caption, { color: colors.textMuted, flex: 1 }]}>
              {chapter}
            </Text>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {premium ? <Ionicons name="lock-closed" size={14} color={colors.warning} accessibilityLabel="Premium" /> : null}
        </View>
        {title}
        {snippet}
      </PressableScale>
    </FadeInUp>
  );
}

/**
 * Inline global search results. Every tap goes through the SAME navigation as
 * the normal topic list (LearningTopic / LearningGrid), whose reader screen
 * enforces the premium gate (`locked`) — nothing is bypassed here; the lock
 * icon is only a hint.
 */
export function SearchResults({
  query,
  debouncedQuery,
  grids,
  onOpenTopic,
  onOpenGrid,
}: {
  query: string;
  debouncedQuery: string;
  grids: LearningGridCard[];
  onOpenTopic: (hit: LearningSearchHit) => void;
  onOpenGrid: (gridSlug: string, gridName: string) => void;
}) {
  const { colors, type } = useTheme();
  const { data: hits, isFetching, isError, refetch } = useLearningSearch(debouncedQuery);
  const pending = query.trim() !== debouncedQuery.trim() || (isFetching && !hits);
  const accentBySlug = new Map(grids.map((g) => [g.slug, g.accent_color]));

  if (pending) return <ListRowsSkeleton />;
  if (isError) {
    return <StateBlock tone="error" emoji="😕" title="Search failed" message="Check your connection and try again." actionLabel="Retry" onAction={() => refetch()} />;
  }
  if (!hits || hits.length === 0) {
    return <StateBlock emoji="🔍" title="No topics found" message={`Nothing matches “${query.trim()}”. Try a different word or a shorter search.`} />;
  }

  return (
    <View style={{ gap: SPACE[3] }}>
      <Text style={[type.small, { color: colors.textSecondary }]} accessibilityLiveRegion="polite">
        {hits.length} result{hits.length === 1 ? "" : "s"}
      </Text>
      {hits.map((hit, i) => {
        const isGrid = hit.kind === "grid" || !hit.topic_slug;
        return (
          <TopicLinkRow
            key={`${hit.grid_slug}-${hit.topic_slug ?? "grid"}-${i}`}
            index={i}
            a11yLabel={`${hit.title}, ${hit.grid_name}${hit.section_name ? `, ${hit.section_name}` : ""}${hit.is_premium ? ", premium" : ""}`}
            badge={<CourseBadge name={hit.grid_name} slug={hit.grid_slug} accentColor={accentBySlug.get(hit.grid_slug)} />}
            chapter={isGrid ? "Course" : hit.section_name}
            premium={hit.is_premium}
            title={<HighlightedText text={hit.title} query={query} style={[type.title, { color: colors.text }]} />}
            snippet={hit.snippet ? <HighlightedText text={hit.snippet} query={query} numberOfLines={2} style={[type.small, { color: colors.textSecondary }]} /> : null}
            onPress={() => (isGrid ? onOpenGrid(hit.grid_slug, hit.grid_name) : onOpenTopic(hit))}
          />
        );
      })}
    </View>
  );
}
