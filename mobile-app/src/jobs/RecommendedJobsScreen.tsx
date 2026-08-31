import React from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { JobCard } from "@/components/cards";
import { useRecommendedJobs, useToggleSavedJob, useSavedJobs } from "@/hooks/useJobs";
import type { JobStackParamList, Job } from "@/types";

type Nav = NativeStackNavigationProp<JobStackParamList, "RecommendedJobs">;

export function RecommendedJobsScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useRecommendedJobs();
  const { data: saved } = useSavedJobs();
  const savedIds = new Set((saved ?? []).map((j) => j.id));

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Recommended for You</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading recommendations..." />
      ) : isError ? (
        <ErrorState message="Couldn't load recommended jobs." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="briefcase-outline" title="No recommendations yet" subtitle="Complete your profile to get better matches." />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RecommendedItem job={item} isSaved={savedIds.has(item.id)} navigation={navigation} />}
        />
      )}
    </Screen>
  );
}

function RecommendedItem({ job, isSaved, navigation }: { job: Job; isSaved: boolean; navigation: Nav }) {
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

export default RecommendedJobsScreen;
