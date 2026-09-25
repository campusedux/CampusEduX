import React, { useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  Screen,
  LoadingState,
  ErrorState,
  EmptyState,
  SectionHeader,
  DrawerMenuButton,
} from "@/components/ui";
import { ProjectCard, JobCard } from "@/components/cards";
import { CustomProjectBanner } from "@/components/CustomProjectBanner";
import { useTrendingProjects, useLatestJobs, useNotifications } from "@/hooks/useHomeData";
import { useLearningGrids } from "@/hooks/useLearning";
import { HomeLearningCard, HomeLearningDots, HOME_LEARNING_CARD_WIDTH, HOME_LEARNING_CARD_GAP } from "./HomeLearningCard";
import { HomeCategoryTile } from "./HomeCategoryTile";
import { CodingPracticeCard, PracticeMiniCard } from "./HomePracticeSection";
import { usePracticeCategories } from "@/hooks/usePractice";
import { useAuthStore } from "@/store/authStore";
import type { HomeStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<HomeStackParamList, "HomeDashboard">;

interface HomeCategory {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  /** Diagonal icon gradient, light → dark. */
  colors: [string, string];
  badge?: string;
  go: (nav: any) => void;
}

/**
 * Major functions kept directly on the Home page — not buried in "View All".
 * The Learning content system stays reachable from the Learning tab / drawer
 * and the "Learning" section further down this feed.
 */
const CATEGORIES: HomeCategory[] = [
  {
    label: "Projects",
    icon: "cube",
    color: "#7C3AED",
    colors: ["#A78BFA", "#6D28D9"],
    go: (n) => n.getParent()?.navigate("Projects", { screen: "AllProjects" }),
  },
  {
    label: "Jobs",
    icon: "briefcase",
    color: "#0EA5E9",
    colors: ["#38BDF8", "#0369A1"],
    go: (n) => n.getParent()?.navigate("Jobs", { screen: "JobsDashboard" }),
  },
  {
    label: "Learning",
    icon: "school",
    color: "#16A34A",
    colors: ["#4ADE80", "#15803D"],
    go: (n) => n.getParent()?.navigate("Prep", { screen: "LearningGrids" }),
  },
  {
    label: "Resume Builder",
    icon: "document-text",
    color: "#DB2777",
    colors: ["#F472B6", "#BE185D"],
    go: (n) => n.getParent()?.navigate("ResumeBuilder", { screen: "ResumeDashboard" }),
  },
  {
    label: "Custom Project",
    icon: "construct",
    color: "#4F46E5",
    colors: ["#818CF8", "#3730A3"],
    go: (n) => n.getParent()?.navigate("CustomProjects", { screen: "BuilderStart" }),
  },
  {
    label: "Practice",
    icon: "code-slash",
    color: "#0D9488",
    colors: ["#2DD4BF", "#0F766E"],
    badge: "NEW",
    go: (n) => n.navigate("PracticeHub"),
  },
];

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const [searchText, setSearchText] = useState("");

  const trending = useTrendingProjects();
  const jobs = useLatestJobs();
  const notifications = useNotifications();
  const learning = useLearningGrids();
  const practiceCategories = usePracticeCategories();
  // Only a real total (sum of the RPC's per-category counts); null hides the count.
  const practiceTotal = (practiceCategories.data ?? []).reduce((n, c) => n + (c.problem_count || 0), 0) || null;
  const [learnIndex, setLearnIndex] = useState(0);
  const unreadCount = (notifications.data ?? []).filter((n) => !n.isRead).length;

  const submitSearch = () => {
    if (searchText.trim().length > 0) {
      (navigation as any).navigate("SearchResult", { initialQuery: searchText.trim() });
    }
  };

  const openProjectDetail = (projectId: string) =>
    (navigation.getParent() as any)?.navigate("Projects", { screen: "ProjectDetails", params: { projectId } });
  const openJobDetail = (jobId: string) =>
    (navigation.getParent() as any)?.navigate("Jobs", { screen: "JobDetails", params: { jobId } });
  const openGrid = (gridSlug: string, gridName: string) =>
    (navigation.getParent() as any)?.navigate("Prep", { screen: "LearningGrid", params: { gridSlug, gridName } });
  const openLearn = () => (navigation.getParent() as any)?.navigate("Prep", { screen: "LearningGrids" });

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-5">
        <DrawerMenuButton />
        <View className="flex-1 ml-3">
          <Text className="text-xl font-bold text-gray-900">
            Hello, {user?.fullName?.split(" ")[0] || "there"} 👋
          </Text>
          <Text className="text-gray-500 text-sm mt-0.5">What do you want to learn today?</Text>
        </View>
        <Pressable onPress={() => (navigation as any).navigate("Notifications")} className="relative ml-3" hitSlop={8}>
          <Ionicons name="notifications-outline" size={26} color="#111827" />
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-danger rounded-full w-4 h-4 items-center justify-center">
              <Text className="text-white text-[9px] font-bold">{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <Pressable
        onPress={() => (navigation as any).navigate("SearchResult")}
        className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 mb-5"
        style={{ height: 48 }}
      >
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          className="flex-1 ml-2 text-gray-900"
          placeholder="Search projects, jobs and topics..."
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={submitSearch}
          returnKeyType="search"
        />
      </Pressable>

      <CustomProjectBanner />

      <SectionHeader title="Categories" onViewAll={() => (navigation as any).navigate("AllCategories")} />
      <View className="flex-row flex-wrap justify-between mb-2">
        {CATEGORIES.map((c, i) => (
          <HomeCategoryTile
            key={c.label}
            label={c.label}
            icon={c.icon}
            color={c.color}
            colors={c.colors}
            badge={c.badge}
            index={i}
            onPress={() => c.go(navigation)}
          />
        ))}
      </View>

      {trending.isLoading || (trending.data && trending.data.length > 0) ? (
        <View className="mt-1">
          <SectionHeader title="Trending Projects" onViewAll={() => (navigation as any).navigate("TrendingProjects")} />
          {trending.isLoading ? (
            <LoadingState label="Loading trending projects..." />
          ) : (
            trending.data?.slice(0, 3).map((project) => (
              <ProjectCard key={project.id} project={project} onPress={() => openProjectDetail(project.id)} />
            ))
          )}
        </View>
      ) : null}

      {/* Learning section — sits directly above Latest Jobs and uses the same card as jobs. */}
      <View className="mt-3">
        <SectionHeader title="Learning" onViewAll={openLearn} />
        {learning.isLoading ? (
          <LoadingState label="Loading learning resources..." />
        ) : learning.isError ? (
          <ErrorState message="Couldn't load learning resources." onRetry={() => learning.refetch()} />
        ) : learning.data && learning.data.length > 0 ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={HOME_LEARNING_CARD_WIDTH + HOME_LEARNING_CARD_GAP}
              decelerationRate="fast"
              scrollEventThrottle={16}
              onScroll={(e) =>
                setLearnIndex(Math.round(e.nativeEvent.contentOffset.x / (HOME_LEARNING_CARD_WIDTH + HOME_LEARNING_CARD_GAP)))
              }
              contentContainerStyle={{ gap: HOME_LEARNING_CARD_GAP, paddingTop: 4, paddingBottom: 16 }}
            >
              {learning.data.slice(0, 4).map((grid, i) => (
                <HomeLearningCard key={grid.id} grid={grid} index={i} onPress={() => openGrid(grid.slug, grid.name)} />
              ))}
            </ScrollView>
            <HomeLearningDots count={Math.min(learning.data.length, 4)} active={learnIndex} />
          </>
        ) : (
          <EmptyState title="No learning resources yet" />
        )}
      </View>

      <View className="mt-3">
        <SectionHeader title="Practice" onViewAll={() => (navigation as any).navigate("PracticeHub")} />
        <CodingPracticeCard problemCount={practiceTotal} onPress={() => (navigation as any).navigate("PracticeProblems")} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <PracticeMiniCard
            title="Mock Tests"
            subtitle="Timed tests & scores"
            icon="clipboard"
            color="#F59E0B"
            colors={["#FBBF24", "#D97706"]}
            index={1}
            onPress={openLearn}
          />
          <PracticeMiniCard
            title="Interview Questions"
            subtitle="Topic-wise Q&A"
            icon="chatbubble-ellipses"
            color="#8B5CF6"
            colors={["#A78BFA", "#6D28D9"]}
            index={2}
            onPress={() => (navigation as any).navigate("InterviewCategories")}
          />
        </View>
      </View>

      {jobs.isLoading || (jobs.data && jobs.data.length > 0) ? (
        <View className="mt-3">
          <SectionHeader title="Latest Jobs" onViewAll={() => (navigation as any).navigate("LatestJobs")} />
          {jobs.isLoading ? (
            <LoadingState label="Loading jobs..." />
          ) : (
            jobs.data?.slice(0, 3).map((job) => <JobCard key={job.id} job={job} onPress={() => openJobDetail(job.id)} />)
          )}
        </View>
      ) : null}

      <View className="h-6" />
    </Screen>
  );
}

export default HomeScreen;
