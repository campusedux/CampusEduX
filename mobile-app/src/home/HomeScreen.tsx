import React, { useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
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
  PressableScale,
} from "@/components/ui";
import { ProjectCard, JobCard } from "@/components/cards";
import { CustomProjectBanner } from "@/components/CustomProjectBanner";
import { useTrendingProjects, useLatestJobs, useNotifications } from "@/hooks/useHomeData";
import { useLearningGrids } from "@/hooks/useLearning";
import { useAuthStore } from "@/store/authStore";
import { CARD_SHADOW, CARD_SHADOW_LG } from "@/constants/theme";
import type { HomeStackParamList, LearningGridCard } from "@/types";

type Nav = NativeStackNavigationProp<HomeStackParamList, "HomeDashboard">;

interface HomeCategory {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
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
    color: "#4F39F6",
    bg: "#EEF0FF",
    go: (n) => n.getParent()?.navigate("Projects", { screen: "AllProjects" }),
  },
  {
    label: "Jobs",
    icon: "briefcase",
    color: "#0EA5E9",
    bg: "#E0F2FE",
    go: (n) => n.getParent()?.navigate("Jobs", { screen: "JobsDashboard" }),
  },
  {
    label: "Learning",
    icon: "school",
    color: "#16A34A",
    bg: "#DCFCE7",
    go: (n) => n.getParent()?.navigate("Prep", { screen: "LearningGrids" }),
  },
  {
    label: "Resume Builder",
    icon: "document-text",
    color: "#DB2777",
    bg: "#FCE7F3",
    go: (n) => n.getParent()?.navigate("ResumeBuilder", { screen: "ResumeDashboard" }),
  },
  {
    label: "Custom Project",
    icon: "construct",
    color: "#4F39F6",
    bg: "#EEF0FF",
    go: (n) => n.getParent()?.navigate("CustomProjects", { screen: "BuilderStart" }),
  },
];

interface PracticeCard {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  go: (nav: any) => void;
}

/** Mirrors the website Home "Practice" cards (Coding Practice / Mock Tests / Interview Questions). */
const PRACTICE: PracticeCard[] = [
  {
    title: "Coding Practice",
    subtitle: "Solve problems in 5 languages",
    icon: "code-slash",
    color: "#4F39F6",
    bg: "#EEF0FF",
    go: (n) => n.navigate("PracticeProblems"),
  },
  {
    title: "Mock Tests",
    subtitle: "Timed tests on Learning topics",
    icon: "clipboard",
    color: "#0D9488",
    bg: "#CCFBF1",
    go: (n) => n.getParent()?.navigate("Prep", { screen: "LearningGrids" }),
  },
  {
    title: "Interview Questions",
    subtitle: "Questions & answers by topic",
    icon: "chatbubble-ellipses",
    color: "#DB2777",
    bg: "#FCE7F3",
    go: (n) => n.navigate("InterviewCategories"),
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
  const openPremium = () => (navigation.getParent() as any)?.navigate("Premium", { screen: "PremiumPlans" });
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

      <CustomProjectBanner
        onStartProject={() => (navigation.getParent() as any)?.navigate("CustomProjects", { screen: "BuilderStart" })}
        onLearnMore={() => (navigation.getParent() as any)?.navigate("CustomProjects", { screen: "BuilderStart" })}
      />

      {!user?.isPremium && (
        <PressableScale
          onPress={openPremium}
          className="rounded-2xl p-5 mb-6 flex-row items-center"
          style={{ backgroundColor: "#4F39F6", ...CARD_SHADOW_LG }}
        >
          <View className="flex-1 pr-3">
            <Text className="text-white font-bold text-base mb-1">Upgrade to Premium</Text>
            <Text className="text-white/80 text-sm mb-3">Unlock premium projects & expert resources</Text>
            <View className="self-start bg-yellow-400 rounded-lg px-4 py-2">
              <Text className="text-yellow-900 font-semibold text-sm">Upgrade Now</Text>
            </View>
          </View>
          <Ionicons name="ribbon" size={44} color="#FBBF24" />
        </PressableScale>
      )}

      <SectionHeader title="Categories" onViewAll={() => (navigation as any).navigate("AllCategories")} />
      <View className="flex-row flex-wrap justify-between mb-4">
        {CATEGORIES.map((c) => (
          <PressableScale
            key={c.label}
            onPress={() => c.go(navigation)}
            className="items-center bg-white rounded-2xl border border-gray-100 py-4 mb-3"
            style={{ width: "31%", ...CARD_SHADOW }}
          >
            <View className="w-14 h-14 rounded-2xl items-center justify-center mb-2" style={{ backgroundColor: c.bg }}>
              <Ionicons name={c.icon} size={26} color={c.color} />
            </View>
            <Text className="text-gray-700 text-[11px] font-medium text-center px-1" numberOfLines={2}>
              {c.label}
            </Text>
          </PressableScale>
        ))}
      </View>

      <View className="mt-1">
        <SectionHeader title="Trending Projects" onViewAll={() => (navigation as any).navigate("TrendingProjects")} />
        {trending.isLoading ? (
          <LoadingState label="Loading trending projects..." />
        ) : trending.isError ? (
          <ErrorState message="Couldn't load trending projects." onRetry={() => trending.refetch()} />
        ) : trending.data && trending.data.length > 0 ? (
          trending.data.slice(0, 3).map((project) => (
            <ProjectCard key={project.id} project={project} onPress={() => openProjectDetail(project.id)} />
          ))
        ) : (
          <EmptyState title="No trending projects yet" />
        )}
      </View>

      {/* Learning section — sits directly above Latest Jobs and uses the same card as jobs. */}
      <View className="mt-3">
        <SectionHeader title="Learning" onViewAll={openLearn} />
        {learning.isLoading ? (
          <LoadingState label="Loading learning resources..." />
        ) : learning.isError ? (
          <ErrorState message="Couldn't load learning resources." onRetry={() => learning.refetch()} />
        ) : learning.data && learning.data.length > 0 ? (
          learning.data
            .slice(0, 4)
            .map((grid) => (
              <LearningCard key={grid.id} grid={grid} onPress={() => openGrid(grid.slug, grid.name)} />
            ))
        ) : (
          <EmptyState title="No learning resources yet" />
        )}
      </View>

      <View className="mt-3">
        <SectionHeader title="Practice" onViewAll={() => (navigation as any).navigate("PracticeHub")} />
        <View className="flex-row flex-wrap justify-between">
          {PRACTICE.map((c) => (
            <PressableScale
              key={c.title}
              onPress={() => c.go(navigation)}
              className="items-center bg-white rounded-2xl border border-gray-100 py-4 px-1 mb-3"
              style={{ width: "31%", ...CARD_SHADOW }}
            >
              <View className="w-12 h-12 rounded-2xl items-center justify-center mb-2" style={{ backgroundColor: c.bg }}>
                <Ionicons name={c.icon} size={24} color={c.color} />
              </View>
              <Text className="text-gray-900 text-[12px] font-bold text-center" numberOfLines={2}>
                {c.title}
              </Text>
              <Text className="text-gray-500 text-[10px] text-center mt-0.5 px-1" numberOfLines={3}>
                {c.subtitle}
              </Text>
            </PressableScale>
          ))}
        </View>
      </View>

      <View className="mt-3">
        <SectionHeader title="Latest Jobs" onViewAll={() => (navigation as any).navigate("LatestJobs")} />
        {jobs.isLoading ? (
          <LoadingState label="Loading jobs..." />
        ) : jobs.isError ? (
          <ErrorState message="Couldn't load jobs." onRetry={() => jobs.refetch()} />
        ) : jobs.data && jobs.data.length > 0 ? (
          jobs.data.slice(0, 3).map((job) => <JobCard key={job.id} job={job} onPress={() => openJobDetail(job.id)} />)
        ) : (
          <EmptyState title="No jobs available right now" />
        )}
      </View>

      <View className="h-6" />
    </Screen>
  );
}

/**
 * Learning card — mirrors {@link JobCard} exactly: same width, corner radius,
 * padding, vertical spacing, shadow and bottom margin, so the Learning section
 * reads as a full content feed rather than a compact list. Book icon + title +
 * a two-line description, then a bottom row with a topic-count badge (same style
 * as the job-type pill) and a right-aligned arrow.
 */
function LearningCard({ grid, onPress }: { grid: LearningGridCard; onPress: () => void }) {
  const topicLabel = `${grid.topic_count} Topic${grid.topic_count === 1 ? "" : "s"}`;
  return (
    <PressableScale
      onPress={onPress}
      className="bg-white rounded-2xl border border-gray-100 p-4 mb-3"
      style={CARD_SHADOW}
    >
      <View className="flex-row items-start">
        <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
          <Ionicons name="book-outline" size={22} color="#4F39F6" />
        </View>

        <View className="flex-1">
          <Text className="font-bold text-gray-900" numberOfLines={1}>
            {grid.name}
          </Text>
          <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={2}>
            {topicLabel}
            {grid.description ? ` • ${grid.description}` : ""}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-3">
        <View className="rounded-lg px-2.5 py-1" style={{ backgroundColor: "#EEF0FF" }}>
          <Text className="text-primary text-[11px] font-semibold">{topicLabel}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </View>
    </PressableScale>
  );
}

export default HomeScreen;
