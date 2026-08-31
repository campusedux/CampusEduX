import React, { useState } from "react";
import { View, Text, Pressable, TextInput, FlatList } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { JobCard } from "@/components/cards";
import { useSearchJobs, useToggleSavedJob, useSavedJobs } from "@/hooks/useJobs";
import type { JobStackParamList, Job } from "@/types";

type Nav = NativeStackNavigationProp<JobStackParamList, "SearchJobs">;
type Rte = RouteProp<JobStackParamList, "SearchJobs">;

export function SearchJobsScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const [query, setQuery] = useState(params?.initialQuery ?? "");

  const { data, isLoading, isError, refetch } = useSearchJobs(query);
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
            value={query}
            onChangeText={setQuery}
            placeholder="Search job title, skills or company"
            placeholderTextColor="#9CA3AF"
            autoFocus={!params?.initialQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
        <Pressable onPress={() => (navigation as any).navigate("FilterJobs")} className="ml-3">
          <Ionicons name="options-outline" size={22} color="#111827" />
        </Pressable>
      </View>

      {query.trim().length > 1 && <Text className="text-gray-400 text-sm mb-3">{data?.length ?? 0} jobs found</Text>}

      {query.trim().length < 2 ? (
        <EmptyState icon="search-outline" title="Search for a job" subtitle="Try a title, skill, or company name." />
      ) : isLoading ? (
        <LoadingState label="Searching..." />
      ) : isError ? (
        <ErrorState message="Search failed." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No jobs found" subtitle={`Nothing matched "${query}"`} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
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
