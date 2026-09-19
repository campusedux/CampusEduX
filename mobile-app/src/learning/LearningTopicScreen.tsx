import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui";
import { LearningScreen } from "@/components/learning/LearningScreen";
import { StateBlock } from "@/components/learning/LearningStates";
import { CompleteButton } from "@/components/learning/reader/CompleteButton";
import { FontSizeMenu } from "@/components/learning/reader/FontSizeMenu";
import { PracticeLinks } from "@/components/learning/reader/PracticeLinks";
import { ReaderContent } from "@/components/learning/reader/ReaderContent";
import { ReaderHeader } from "@/components/learning/reader/ReaderHeader";
import { ReaderSkeleton } from "@/components/learning/reader/ReaderSkeleton";
import { ReaderTopBar } from "@/components/learning/reader/ReaderTopBar";
import { ReadingProgressBar } from "@/components/learning/reader/ReadingProgressBar";
import { TableOfContents } from "@/components/learning/reader/TableOfContents";
import { TopicNavFooter, type NavTarget } from "@/components/learning/reader/TopicNavFooter";
import { AnchorRegistry, ReaderCtx } from "@/components/learning/reader/readerContext";
import { FadeInUp } from "@/components/learning/FadeInUp";
import { useReadingActivity } from "@/hooks/useReadingActivity";
import { useLearningBookmarks, useLearningTopic, useLearningTree, useToggleLearningBookmark, useTopicPractice } from "@/hooks/useLearning";
import { selectionHaptic, successHaptic } from "@/learning/haptics";
import { MIN_TOC_ITEMS, prepareTopic } from "@/learning/reader/readerModel";
import { progressSnapshot, useIsTopicCompleted, useProgressActions, useReaderFontSize } from "@/learning/progress/progressStore";
import { useAuthStore } from "@/store/authStore";
import { BREAKPOINTS, LAYOUT, ReaderSizeContext, SPACE, useTheme } from "@/theme";
import type { PlacementStackParamList, TopicCodingProblemCard, TopicMockTestCard } from "@/types";

type Nav = NativeStackNavigationProp<PlacementStackParamList, "LearningTopic">;
type Rte = RouteProp<PlacementStackParamList, "LearningTopic">;

const TOP_BAR_HEIGHT = 60;
/** Fallback if the content never grows tall enough to restore into (short topic, content changed). */
const RESTORE_TIMEOUT_MS = 1500;

/** Outer shell: provides the reader's "Aa" size to every descendant's `useTheme()`. */
export function LearningTopicScreen() {
  const [fontSize, setFontSize] = useReaderFontSize();
  return (
    <ReaderSizeContext.Provider value={fontSize}>
      <TopicReader fontSize={fontSize} setFontSize={setFontSize} />
    </ReaderSizeContext.Provider>
  );
}

function TopicReader({ fontSize, setFontSize }: { fontSize: import("@/theme").ReaderFontSize; setFontSize: (s: import("@/theme").ReaderFontSize) => void }) {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { colors, accentFor, width, gutter } = useTheme();
  const userId = useAuthStore((s) => s.user?.id);
  const isPremiumUser = useAuthStore((s) => s.user?.isPremium ?? false);

  const { data, isLoading, isError, refetch } = useLearningTopic(params.gridSlug, params.topicSlug);
  const { data: tree } = useLearningTree(params.gridSlug);
  const { data: bookmarks } = useLearningBookmarks();
  const { mutate: setBookmark } = useToggleLearningBookmark();
  const { data: practice } = useTopicPractice(params.gridSlug, params.topicSlug);
  const completed = useIsTopicCompleted(params.gridSlug, params.topicSlug);
  const { markOpened, markComplete, unmarkComplete, setScroll } = useProgressActions();

  const locked = !!data?.locked;
  const readable = !!data && !locked;
  // Locked (premium-gated) topics are never recorded: no last-opened, no reading credit, no scroll saving, no completion.
  const canTrack = readable && !!userId;

  // Feeds the Learning Home "Continue Learning" card + the daily-streak rule (≥ 60 s on a readable topic).
  useEffect(() => {
    if (!data || data.locked) return;
    markOpened({ gridSlug: params.gridSlug, gridName: data.grid.name, topicSlug: params.topicSlug, topicTitle: data.topic.title, sectionName: data.section.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.topic.id, data?.locked, params.gridSlug, params.topicSlug]);
  useReadingActivity(data?.topic.id, readable);

  const accent = useMemo(
    () => accentFor({ slug: params.gridSlug, name: data?.grid.name ?? tree?.grid.name, accentColor: tree?.grid.accent_color }),
    [accentFor, params.gridSlug, data?.grid.name, tree?.grid.name, tree?.grid.accent_color],
  );

  // Parsed once per topic (not per scroll / render).
  const prepared = useMemo(() => (data && !data.locked ? prepareTopic(data.contents, data.topic.title) : null), [data]);
  const showToc = !!prepared && prepared.toc.length >= MIN_TOC_ITEMS;
  const sidebar = showToc && width >= BREAKPOINTS.desktop;

  const anchors = useRef(new AnchorRegistry()).current;
  const readerCtx = useMemo(() => ({ accent, anchors, enableRun: true }), [accent, anchors]);

  // ── scrolling: progress bar, position save/restore, outline jumps ──────────────────────────────
  const scrollRef = useRef<any>(null);
  const contentRef = useRef<View>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const maxScroll = useRef(new Animated.Value(1)).current;
  const progress = useMemo(() => Animated.divide(scrollY, maxScroll), [scrollY, maxScroll]);
  const lastY = useRef(0);
  const viewportH = useRef(0);
  const contentH = useRef(0);

  // Progress bar runs on the native thread (no React re-render). Web has no native driver, so it also tracks lastY there.
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: Platform.OS !== "web",
        listener: Platform.OS === "web" ? (e: any) => void (lastY.current = e.nativeEvent.contentOffset.y) : undefined,
      }),
    [scrollY],
  );
  const updateMax = () => maxScroll.setValue(Math.max(1, contentH.current - viewportH.current));

  const savedOffset = useRef(0);
  const restored = useRef(true);
  const trackRef = useRef({ canTrack: false, grid: params.gridSlug, topic: params.topicSlug });
  trackRef.current = { canTrack, grid: params.gridSlug, topic: params.topicSlug };

  const persistScroll = useCallback(() => {
    const t = trackRef.current;
    if (t.canTrack && restored.current) setScroll(t.grid, t.topic, lastY.current);
  }, [setScroll]);

  const restoreNow = useCallback((y: number) => {
    scrollRef.current?.scrollTo({ y, animated: false });
    lastY.current = y;
    restored.current = true;
  }, []);

  // Decide, once per topic, whether to restore. A COMPLETED topic always starts from the top.
  useEffect(() => {
    if (!data?.topic.id || !canTrack) return;
    const done = progressSnapshot().isCompleted(params.gridSlug, params.topicSlug);
    const saved = done ? 0 : progressSnapshot().getScroll(params.gridSlug, params.topicSlug);
    savedOffset.current = saved;
    restored.current = saved < 40;
    if (restored.current) return;
    const id = setTimeout(() => {
      if (!restored.current) restoreNow(Math.min(savedOffset.current, Math.max(0, contentH.current - viewportH.current)));
    }, RESTORE_TIMEOUT_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.topic.id, canTrack]);

  // Save on leaving the screen (back, or replace → next/previous topic).
  useEffect(() => () => persistScroll(), [persistScroll]);

  const scrollToAnchor = useCallback((id: string) => {
    const node = anchors.get(id);
    if (!node || !contentRef.current) return;
    node.measureLayout(
      contentRef.current,
      (_x: number, y: number) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true }),
      () => undefined,
    );
  }, [anchors]);

  // ── actions ────────────────────────────────────────────────────────────────────────────────────
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const isBookmarked = !!data && (bookmarks?.has(data.topic.id) ?? false);
  const toggleBookmark = () => {
    if (!data) return;
    selectionHaptic();
    setBookmark({ topicId: data.topic.id, isBookmarked });
  };
  const toggleComplete = () => {
    if (completed) {
      selectionHaptic();
      unmarkComplete(params.gridSlug, params.topicSlug);
    } else {
      successHaptic();
      markComplete(params.gridSlug, params.topicSlug);
    }
  };

  // Chapter of any topic (for the "Next chapter ·" hint when a neighbour crosses a boundary).
  const chapterBySlug = useMemo(() => {
    const m = new Map<string, string>();
    tree?.sections.forEach((s) => s.topics.forEach((t) => m.set(t.slug, s.name)));
    return m;
  }, [tree]);
  const asTarget = (n: { title: string; slug: string } | null): NavTarget | null => {
    if (!n) return null;
    const ch = chapterBySlug.get(n.slug);
    return { title: n.title, slug: n.slug, chapterName: ch && data && ch !== data.section.name ? ch : undefined };
  };
  const openNeighbour = (t: NavTarget) => navigation.replace("LearningTopic", { gridSlug: params.gridSlug, topicSlug: t.slug, topicTitle: t.title });
  // Same destinations + premium redirect as before.
  const openMockTest = (t: TopicMockTestCard) =>
    t.is_premium && !isPremiumUser ? navigation.getParent()?.navigate("Premium", { screen: "PremiumPlans" }) : navigation.navigate("TestInstruction", { testId: t.id });
  const openProblem = (p: TopicCodingProblemCard) => navigation.navigate("LearningCodingProblem", { slug: p.slug, title: p.title });

  const goBack = () => navigation.goBack();

  // ── top-level states ───────────────────────────────────────────────────────────────────────────
  const shell = (children: React.ReactNode) => (
    <LearningScreen>
      <View style={{ flex: 1 }}>{children}</View>
    </LearningScreen>
  );
  const bareBar = (
    <ReaderTopBar
      courseName={params.topicTitle ?? "Learning"}
      onBack={goBack}
      showFontControl={false}
      fontMenuOpen={false}
      onToggleFontMenu={() => undefined}
      canBookmark={false}
      bookmarked={false}
      onToggleBookmark={() => undefined}
      accentColor={accent.base}
    />
  );

  if (isLoading) {
    return shell(
      <>
        {bareBar}
        <View style={{ padding: gutter, maxWidth: LAYOUT.readingMaxWidth, width: "100%", alignSelf: "center" }}>
          <ReaderSkeleton />
        </View>
      </>,
    );
  }
  if (isError || !data) {
    return shell(
      <>
        {bareBar}
        <StateBlock tone="error" emoji="😕" title={isError ? "Couldn't load this topic" : "This topic isn't available"} message="Check your connection and try again." actionLabel="Retry" onAction={() => refetch()} />
      </>,
    );
  }

  const prev = asTarget(data.prev);
  const next = asTarget(data.next);

  const endSection = (
    <View style={{ marginTop: SPACE[10], gap: SPACE[8] }}>
      {canTrack ? <CompleteButton completed={completed} onToggle={toggleComplete} accent={accent} /> : null}
      <PracticeLinks practice={practice} isPremiumUser={isPremiumUser} accent={accent} onOpenMockTest={openMockTest} onOpenProblem={openProblem} />
      <TopicNavFooter prev={prev} next={next} onOpen={openNeighbour} />
    </View>
  );

  const article = (
    <View ref={contentRef} collapsable={false} style={{ width: "100%", maxWidth: LAYOUT.readingMaxWidth + gutter * 2, alignSelf: "center", paddingHorizontal: gutter, paddingTop: SPACE[4], paddingBottom: SPACE[12] }}>
      <FadeInUp>
        <ReaderHeader title={data.topic.title} summary={data.topic.short_description} minutes={prepared?.readingMinutes} chapterName={data.section.name} accent={accent} />
      </FadeInUp>

      {locked ? (
        // Existing locked view — unchanged.
        <View className="border border-amber-200 bg-amber-50 rounded-2xl p-5 items-center mt-3">
          <Ionicons name="lock-closed" size={28} color="#B45309" />
          <Text className="text-amber-900 font-semibold mt-2 mb-1">Premium topic</Text>
          <Text className="text-amber-800 text-sm text-center mb-4">Upgrade to CampusEduX Premium to read this topic.</Text>
          <Button label="See Premium Plans" onPress={() => navigation.getParent()?.navigate("Premium", { screen: "PremiumPlans" })} className="w-full" />
        </View>
      ) : (
        <>
          {showToc && !sidebar ? (
            <View style={{ marginTop: SPACE[5] }}>
              <TableOfContents items={prepared!.toc} accent={accent} variant="collapsible" onSelect={scrollToAnchor} />
            </View>
          ) : null}
          <View style={{ marginTop: SPACE[6] }}>
            {data.contents.length === 0 ? (
              <Text style={{ color: colors.textSecondary }}>This topic has no content yet — check back soon.</Text>
            ) : (
              <ReaderContent blocks={prepared!.blocks} />
            )}
          </View>
        </>
      )}

      {endSection}
    </View>
  );

  return shell(
    <ReaderCtx.Provider value={readerCtx}>
      <View style={{ zIndex: 5 }}>
        <ReaderTopBar
          courseName={data.grid.name}
          chapterName={data.section.name}
          onBack={goBack}
          showFontControl={readable}
          fontMenuOpen={fontMenuOpen}
          onToggleFontMenu={() => setFontMenuOpen((v) => !v)}
          canBookmark={!!userId}
          bookmarked={isBookmarked}
          onToggleBookmark={toggleBookmark}
          accentColor={accent.base}
        />
        {readable ? <ReadingProgressBar progress={progress} color={accent.base} /> : <View style={{ height: 3 }} />}
      </View>

      <View style={{ flex: 1, flexDirection: "row" }}>
        <Animated.ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          onLayout={(e: any) => {
            viewportH.current = e.nativeEvent.layout.height;
            updateMax();
          }}
          onContentSizeChange={(_w: number, h: number) => {
            contentH.current = h;
            updateMax();
            if (!restored.current && h - viewportH.current >= savedOffset.current - 2) restoreNow(savedOffset.current);
          }}
          onScrollEndDrag={(e: any) => {
            lastY.current = e.nativeEvent.contentOffset.y;
            persistScroll();
          }}
          onMomentumScrollEnd={(e: any) => {
            lastY.current = e.nativeEvent.contentOffset.y;
            persistScroll();
          }}
        >
          {article}
        </Animated.ScrollView>

        {sidebar ? (
          // Sticky outline: lives outside the scroller so it never moves.
          <View style={{ width: LAYOUT.tocWidth + SPACE[6], paddingTop: SPACE[6], paddingRight: gutter, paddingBottom: SPACE[6] }}>
            <TableOfContents items={prepared!.toc} accent={accent} variant="sidebar" onSelect={scrollToAnchor} />
          </View>
        ) : null}
      </View>

      <FontSizeMenu open={fontMenuOpen} size={fontSize} onSelect={setFontSize} onClose={() => setFontMenuOpen(false)} top={TOP_BAR_HEIGHT} />
    </ReaderCtx.Provider>,
  );
}


export default LearningTopicScreen;
