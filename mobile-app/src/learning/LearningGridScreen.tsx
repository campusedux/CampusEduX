import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutAnimation, SectionList, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BackButton } from "@/components/learning/BackButton";
import { ChapterHeader } from "@/components/learning/ChapterAccordion";
import { CourseHero } from "@/components/learning/CourseHero";
import { FadeInUp } from "@/components/learning/FadeInUp";
import { ListRowsSkeleton, Skeleton } from "@/components/learning/LearningSkeleton";
import { LearningScreen, PageContainer } from "@/components/learning/LearningScreen";
import { StateBlock } from "@/components/learning/LearningStates";
import { TopicRow } from "@/components/learning/TopicRow";
import { useLearningBookmarks, useLearningTree, useToggleLearningBookmark } from "@/hooks/useLearning";
import { buildChapters, courseTotals, pickResumeTopic, type ChapterView } from "@/learning/courseTree";
import { selectionHaptic } from "@/learning/haptics";
import { estimateCourseTime } from "@/learning/learningFormat";
import { useCompletedSlugs, useLastOpened } from "@/learning/progress/progressStore";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { LAYOUT, MOTION, RADII, SPACE, useTheme } from "@/theme";
import type { LearningTopicRef, PlacementStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<PlacementStackParamList, "LearningGrid">;
type Rte = RouteProp<PlacementStackParamList, "LearningGrid">;

interface ChapterSection {
  key: string;
  chapter: ChapterView;
  open: boolean;
  /** Rows are only handed to the list while the chapter is open — a 294-topic course mounts a handful, not all. */
  data: LearningTopicRef[];
}

const NO_DATA: LearningTopicRef[] = [];

/**
 * Course Detail: gradient hero (progress + Start/Continue) → chapter
 * accordions (each with its own progress) → topic rows. Built on a SectionList
 * so only visible rows of OPEN chapters are mounted. Presentation only: the
 * tree query, routes and premium gating (enforced by the topic screen) are
 * unchanged.
 */
export function LearningGridScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { colors, accentFor } = useTheme();
  const reduce = useSettingsStore((s) => s.preferences.reduceAnimations);
  const userId = useAuthStore((s) => s.user?.id);

  const { data: tree, isLoading, isError, refetch } = useLearningTree(params.gridSlug);
  const completed = useCompletedSlugs(params.gridSlug);
  const lastOpened = useLastOpened();
  const bookmarks = useLearningBookmarks();
  const { mutate: setBookmark } = useToggleLearningBookmark();

  const accent = useMemo(
    () => accentFor({ slug: tree?.grid.slug ?? params.gridSlug, name: tree?.grid.name ?? params.gridName, accentColor: tree?.grid.accent_color }),
    [accentFor, tree?.grid.slug, tree?.grid.name, tree?.grid.accent_color, params.gridSlug, params.gridName],
  );

  const chapters = useMemo(() => buildChapters(tree?.sections ?? [], completed), [tree, completed]);
  const totals = useMemo(() => courseTotals(chapters), [chapters]);
  const lastSlugHere = lastOpened?.gridSlug === params.gridSlug ? lastOpened.topicSlug : null;
  const resume = useMemo(() => pickResumeTopic(chapters, completed, lastSlugHere), [chapters, completed, lastSlugHere]);

  // The topic to highlight as "in progress": the resume target once the learner has begun this course.
  const currentSlug = resume && resume.mode === "continue" ? resume.topic.slug : null;

  // Chapters open state. Until the user toggles one, open the chapter they're up to (else the first).
  const defaultOpen = useMemo<Record<string, boolean>>(() => {
    const id = resume?.chapterId ?? chapters[0]?.id;
    return id ? { [id]: true } : {};
  }, [resume?.chapterId, chapters]);
  const [openOverride, setOpenOverride] = useState<Record<string, boolean> | null>(null);
  const [justToggled, setJustToggled] = useState<string | null>(null);
  const openMap = openOverride ?? defaultOpen;
  // The stagger applies only to rows mounted by the expand itself, not rows that later scroll into view.
  useEffect(() => {
    if (!justToggled) return;
    const id = setTimeout(() => setJustToggled(null), 600);
    return () => clearTimeout(id);
  }, [justToggled]);

  const toggleChapter = useCallback(
    (id: string) => {
      if (!reduce) LayoutAnimation.configureNext(LayoutAnimation.create(MOTION.accordion, "easeInEaseOut", "opacity"));
      setJustToggled(id);
      setOpenOverride((prev) => {
        const base = prev ?? defaultOpen;
        return { ...base, [id]: !base[id] };
      });
    },
    [defaultOpen, reduce],
  );

  const sections = useMemo<ChapterSection[]>(
    () => chapters.map((c) => ({ key: c.id, chapter: c, open: !!openMap[c.id] && c.total > 0, data: openMap[c.id] ? c.topics : NO_DATA })),
    [chapters, openMap],
  );

  // Best-effort: on FIRST open only, bring the in-progress topic into view. The list has variable row
  // heights, so scrollToLocation can miss; retry once after a short wait, then silently give up.
  const listRef = useRef<SectionList<LearningTopicRef, ChapterSection>>(null);
  const autoScrollDone = useRef(false);
  const autoScrollRetried = useRef(false);
  const autoScrollTarget = useMemo(() => {
    if (!currentSlug) return null;
    const sectionIndex = sections.findIndex((s) => s.open && s.data.some((t) => t.slug === currentSlug));
    if (sectionIndex < 0) return null;
    const itemIndex = sections[sectionIndex].data.findIndex((t) => t.slug === currentSlug);
    // Already on screen when it's one of the first rows of the first chapter.
    return sectionIndex === 0 && itemIndex < 3 ? null : { sectionIndex, itemIndex };
  }, [currentSlug, sections]);
  const scrollToCurrent = useCallback(() => {
    if (!autoScrollTarget) return;
    try {
      listRef.current?.scrollToLocation({ ...autoScrollTarget, viewPosition: 0.25, animated: true });
    } catch {
      /* best effort */
    }
  }, [autoScrollTarget]);
  useEffect(() => {
    if (autoScrollDone.current || !autoScrollTarget) return;
    autoScrollDone.current = true; // first open only — never on later focus / re-render
    const id = setTimeout(scrollToCurrent, 400);
    return () => clearTimeout(id);
  }, [autoScrollTarget, scrollToCurrent]);
  const onScrollToIndexFailed = useCallback(() => {
    if (autoScrollRetried.current) return; // second failure → do nothing
    autoScrollRetried.current = true;
    setTimeout(scrollToCurrent, 350);
  }, [scrollToCurrent]);

  const openTopic = useCallback(
    (topic: LearningTopicRef) => navigation.navigate("LearningTopic", { gridSlug: params.gridSlug, topicSlug: topic.slug, topicTitle: topic.title }),
    [navigation, params.gridSlug],
  );
  const onToggleBookmark = useCallback(
    (topic: LearningTopicRef, isBookmarked: boolean) => {
      selectionHaptic();
      setBookmark({ topicId: topic.id, isBookmarked });
    },
    [setBookmark],
  );

  const title = tree?.grid.name ?? params.gridName ?? "Course";
  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  // ── non-list states ────────────────────────────────────────────────────────
  const topBar = (
    <PageContainer maxWidth={LAYOUT.listMaxWidth} style={{ paddingTop: SPACE[2], paddingBottom: SPACE[3] }}>
      <BackButton onPress={goBack} />
    </PageContainer>
  );

  if (isLoading) {
    return (
      <LearningScreen>
        <View accessible accessibilityRole="progressbar" accessibilityLabel={`Loading ${title}`}>
          {topBar}
          <PageContainer maxWidth={LAYOUT.listMaxWidth} style={{ gap: SPACE[4] }}>
            <Skeleton height={300} radius={RADII["2xl"]} />
            <ListRowsSkeleton count={4} />
          </PageContainer>
        </View>
      </LearningScreen>
    );
  }
  if (isError) {
    return (
      <LearningScreen>
        {topBar}
        <StateBlock tone="error" emoji="😕" title="Couldn't load this course" message="Check your connection and try again." actionLabel="Retry" onAction={() => refetch()} />
      </LearningScreen>
    );
  }
  if (!tree) {
    return (
      <LearningScreen>
        {topBar}
        <StateBlock emoji="📭" title="Course not available" message="This course may have been unpublished." />
      </LearningScreen>
    );
  }

  const hero = (
    <FadeInUp>
      <CourseHero
        title={tree.grid.name}
        description={tree.grid.description}
        icon={tree.grid.icon}
        accent={accent}
        chapterCount={chapters.length}
        topicCount={totals.total}
        timeLabel={estimateCourseTime(totals.total)}
        done={totals.done}
        percent={totals.percent}
        mode={resume?.mode ?? null}
        onBack={goBack}
        onCta={() => resume && openTopic(resume.topic)}
      />
    </FadeInUp>
  );

  return (
    <LearningScreen>
      <SectionList<LearningTopicRef, ChapterSection>
        ref={listRef}
        onScrollToIndexFailed={onScrollToIndexFailed}
        sections={sections}
        keyExtractor={(t) => t.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // Long-list tuning (DBMS ≈ 294 topics): small first paint, modest window, cells kept cheap by React.memo rows.
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        updateCellsBatchingPeriod={40}
        windowSize={7}
        contentContainerStyle={{ paddingBottom: SPACE[10] }}
        ListHeaderComponent={
          <PageContainer maxWidth={LAYOUT.listMaxWidth} style={{ paddingTop: SPACE[2], paddingBottom: SPACE[5] }}>
            {hero}
          </PageContainer>
        }
        ListEmptyComponent={<StateBlock emoji="📂" title="No chapters yet" message="Check back soon — content is added regularly." />}
        renderSectionHeader={({ section }) => (
          <PageContainer maxWidth={LAYOUT.listMaxWidth}>
            <ChapterHeader chapter={section.chapter} open={section.open} accent={accent} onToggle={toggleChapter} />
          </PageContainer>
        )}
        renderItem={({ item, index, section }) => (
          <PageContainer maxWidth={LAYOUT.listMaxWidth}>
            <TopicRow
              topic={item}
              number={index + 1}
              isFirst={index === 0}
              isLast={index === section.data.length - 1}
              completed={completed.has(item.slug)}
              current={item.slug === currentSlug}
              bookmarked={bookmarks.data?.has(item.id) ?? false}
              canBookmark={!!userId}
              accent={accent}
              animateIndex={justToggled === section.key ? Math.min(index, MOTION.maxStaggerIndex) : undefined}
              onOpen={openTopic}
              onToggleBookmark={onToggleBookmark}
            />
          </PageContainer>
        )}
        renderSectionFooter={({ section }) => <View style={{ height: section.open ? SPACE[4] : SPACE[3] }} />}
        // Re-render mounted cells when progress / bookmarks / highlight change.
        extraData={{ completed, currentSlug, bookmarks: bookmarks.data, userId, justToggled }}
        style={{ backgroundColor: colors.canvas }}
      />
    </LearningScreen>
  );
}


export default LearningGridScreen;
