import React, { useMemo, useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { notify } from "@/lib/notify";
import { JobCard } from "@/components/cards";
import { useSavedJobs, useToggleSavedJob } from "@/hooks/useJobs";
import type { JobStackParamList, Job } from "@/types";

type Nav = NativeStackNavigationProp<JobStackParamList, "SavedJobs">;
type SortMode = "all" | "recent" | "oldest";

export function SavedJobsScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useSavedJobs();
  const [sortMode, setSortMode] = useState<SortMode>("all");

  const sorted = useMemo(() => {
    const copy = [...(data ?? [])];
    if (sortMode === "recent") copy.reverse();
    if (sortMode === "oldest") return [...(data ?? [])];
    return copy;
  }, [data, sortMode]);

  return (
    <Screen className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">Saved Jobs</Text>
        </View>
      </View>

      <View className="flex-row mb-4" style={{ gap: 8 }}>
        {(["all", "recent", "oldest"] as SortMode[]).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setSortMode(mode)}
            className="px-4 py-2 rounded-full border"
            style={{ backgroundColor: sortMode === mode ? "#4F39F6" : "#fff", borderColor: sortMode === mode ? "#4F39F6" : "#E5E7EB" }}
          >
            <Text className={sortMode === mode ? "text-white font-medium capitalize text-xs" : "text-gray-600 capitalize text-xs"}>
              {mode === "all" ? `All (${data?.length ?? 0})` : mode}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <LoadingState label="Loading saved jobs..." />
      ) : isError ? (
        <ErrorState message="Couldn't load saved jobs." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="bookmark-outline" title="No saved jobs yet" subtitle="Tap the bookmark icon on any job to save it here." />
      ) : (
        <FlatList data={sorted} keyExtractor={(item) => item.id} renderItem={({ item }) => <SavedJobItem job={item} navigation={navigation} />} />
      )}
    </Screen>
  );
}

function SavedJobItem({ job, navigation }: { job: Job; navigation: Nav }) {
  const toggleSaved = useToggleSavedJob(job.id);
  return (
    <JobCard
      job={job}
      isSaved
      onToggleSave={() =>
        toggleSaved.mutate(true, {
          onError: (error: any) =>
            notify("Couldn't remove saved job", error?.message ?? "Please try again."),
        })
      }
      onPress={(j) => (navigation as any).navigate("JobDetails", { jobId: j.id })}
    />
  );
}

export default SavedJobsScreen;
