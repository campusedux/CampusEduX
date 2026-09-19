import React, { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, FlatList } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { JobCard } from "@/components/cards";
import { useAllJobs, useToggleSavedJob, useSavedJobs } from "@/hooks/useJobs";
import { useJobFilterStore } from "@/store/jobFilterStore";
import type { JobStackParamList, Job } from "@/types";

type Nav = NativeStackNavigationProp<JobStackParamList, "SearchJobs">;
type Rte = RouteProp<JobStackParamList, "SearchJobs">;

export function SearchJobsScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const [rawQuery, setRawQuery] = useState(params?.initialQuery ?? "");
  const [query, setQuery] = useState(rawQuery);
  useEffect(() => {
    const t = setTimeout(() => setQuery(rawQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [rawQuery]);

  const { filters } = useJobFilterStore();
  // `query` is composed in here, never written to useJobFilterStore, so
  // "Reset" in the filter modal can't silently wipe this text box.
  const effectiveFilters = { ...filters, query };
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAllJobs(effectiveFilters);
  const jobs = data?.pages.flatMap((p) => p.jobs) ?? [];

  const { data: saved } = useSavedJobs();
  const savedIds = new Set((saved ?? []).map((j) => j.id));

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <View className="flex-1 flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3" style={{ height: 44 }}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 mx-2 text-gray-900"
            value={rawQuery}
            onChangeText={setRawQuery}
            placeholder="Search job title, skills or company"
            placeholderTextColor="#9CA3AF"
            autoFocus={!params?.initialQuery}
          />
          {rawQuery.length > 0 && (
            <Pressable onPress={() => setRawQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
        <Pressable onPress={() => (navigation as any).navigate("FilterJobs")} className="ml-3">
          <Ionicons name="options-outline" size={22} color="#111827" />
        </Pressable>
      </View>

      {!isLoading && !isError && jobs.length > 0 && (
        <Text className="text-gray-400 text-sm mb-3">{jobs.length} jobs found</Text>
      )}

      {isLoading ? (
        <LoadingState label="Loading jobs..." />
      ) : isError ? (
        <ErrorState message="Couldn't load jobs." onRetry={refetch} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No jobs found"
          subtitle={query ? `Nothing matched "${query}"` : "Try a different filter."}
        />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={isFetchingNextPage ? <LoadingState label="Loading more..." /> : null}
          renderItem={({ item }) => (
            <SearchJobItem job={item} isSaved={savedIds.has(item.id)} navigation={navigation} />
          )}
        />
      )}
    </Screen>
  );
}

function SearchJobItem({ job, isSaved, navigation }: { job: Job; isSaved: boolean; navigation: Nav }) {
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

export default SearchJobsScreen;
