import React, { useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState, SectionHeader, DrawerMenuButton, PressableScale } from "@/components/ui";
import { JobCard } from "@/components/cards";
import { CARD_SHADOW, CARD_SHADOW_LG } from "@/constants/theme";
import { useRecommendedJobs, useToggleSavedJob, useSavedJobs } from "@/hooks/useJobs";
import { useAuthStore } from "@/store/authStore";
import { academicFromUser, academicEmptyText } from "@/lib/personalization";
import type { JobStackParamList, Job } from "@/types";

type Nav = NativeStackNavigationProp<JobStackParamList, "JobsDashboard">;

const CATEGORIES = [
  { label: "IT & Software", count: "12.5k Jobs", icon: "code-slash-outline" },
  { label: "Design", count: "2.1k Jobs", icon: "color-palette-outline" },
  { label: "Marketing", count: "1.8k Jobs", icon: "megaphone-outline" },
  { label: "Sales", count: "2.6k Jobs", icon: "trending-up-outline" },
] as const;

export function JobsDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [searchText, setSearchText] = useState("");
  const academic = academicFromUser(useAuthStore((s) => s.user));
  const recommended = useRecommendedJobs();
  const { data: saved } = useSavedJobs();
  const savedIds = new Set((saved ?? []).map((j) => j.id));

  const submitSearch = () => {
    if (searchText.trim().length > 0) (navigation as any).navigate("SearchJobs", { initialQuery: searchText.trim() });
  };

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-5">
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <DrawerMenuButton />
          <Text className="text-xl font-bold text-gray-900">Jobs</Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 16 }}>
          <Pressable onPress={() => (navigation as any).navigate("JobAlerts")}>
            <Ionicons name="notifications-outline" size={24} color="#111827" />
          </Pressable>
          <Pressable onPress={() => (navigation as any).navigate("SavedJobs")}>
            <Ionicons name="bookmark-outline" size={24} color="#111827" />
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={() => (navigation as any).navigate("SearchJobs")}
        className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 mb-5"
        style={{ height: 48 }}
      >
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          className="flex-1 ml-2 text-gray-900"
          placeholder="Search job title, skills or company"
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={submitSearch}
          returnKeyType="search"
        />
      </Pressable>

      <View className="rounded-2xl p-5 mb-6" style={{ backgroundColor: "#4F39F6", ...CARD_SHADOW_LG }}>
        <Text className="text-white font-bold text-base mb-1">Find your dream job</Text>
        <Text className="text-indigo-100 text-sm mb-4">Explore thousands of opportunities from top companies</Text>
        <Pressable className="self-start bg-white rounded-lg px-4 py-2" onPress={() => (navigation as any).navigate("RecommendedJobs")}>
          <Text className="text-primary font-semibold text-sm">Browse Jobs</Text>
        </Pressable>
      </View>

      <SectionHeader title="Top Categories" onViewAll={() => (navigation as any).navigate("SearchJobs")} />
      <View className="flex-row flex-wrap justify-between mb-6">
        {CATEGORIES.map((cat) => (
          <PressableScale
            key={cat.label}
            onPress={() => (navigation as any).navigate("SearchJobs", { initialQuery: cat.label })}
            className="bg-white border border-gray-100 rounded-2xl p-3.5 mb-3"
            style={{ width: "48%", ...CARD_SHADOW }}
          >
            <View className="w-10 h-10 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: "#EEF0FF" }}>
              <Ionicons name={cat.icon as any} size={20} color="#4F39F6" />
            </View>
            <Text className="font-semibold text-gray-900 text-sm">{cat.label}</Text>
            <Text className="text-gray-400 text-xs mt-0.5">{cat.count}</Text>
          </PressableScale>
        ))}
      </View>

      <SectionHeader title="Recommended Jobs" onViewAll={() => (navigation as any).navigate("RecommendedJobs")} />
      {recommended.isLoading ? (
        <LoadingState label="Loading recommended jobs..." />
      ) : recommended.isError ? (
        <ErrorState message="Couldn't load jobs." onRetry={() => recommended.refetch()} />
      ) : !recommended.data || recommended.data.length === 0 ? (
        <EmptyState icon="briefcase-outline" title="No jobs found yet" subtitle={academicEmptyText(academic, "jobs")} />
      ) : (
        recommended.data.slice(0, 3).map((job) => (
          <JobItem key={job.id} job={job} isSaved={savedIds.has(job.id)} navigation={navigation} />
        ))
      )}

      <View className="h-6" />
    </Screen>
  );
}

function JobItem({ job, isSaved, navigation }: { job: Job; isSaved: boolean; navigation: Nav }) {
  const toggleSaved = useToggleSavedJob(job.id);
  return (
    <JobCard
      job={job}
      isSaved={isSaved}
      onToggleSave={() => toggleSaved.mutate(isSaved)}
      onPress={(j) => (navigation as any).navigate("JobDetails", { jobId: j.id })}
    />
  );
}

export default JobsDashboardScreen;
