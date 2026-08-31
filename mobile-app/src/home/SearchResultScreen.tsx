import React, { useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { ProjectCard, JobCard } from "@/components/cards";
import { useSearchAll } from "@/hooks/useHomeData";
import type { HomeStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<HomeStackParamList, "SearchResult">;
type Rte = RouteProp<HomeStackParamList, "SearchResult">;

type Filter = "all" | "projects" | "jobs";
const FILTERS: Filter[] = ["all", "projects", "jobs"];

export function SearchResultScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const [query, setQuery] = useState(params?.initialQuery ?? "");
  const [filter, setFilter] = useState<Filter>("all");

  const { data, isLoading, isError, refetch } = useSearchAll(query);
  const projects = filter === "jobs" ? [] : data?.projects ?? [];
  const jobs = filter === "projects" ? [] : data?.jobs ?? [];
  const totalResults = projects.length + jobs.length;
  const ready = query.trim().length > 1;

  return (
    <Screen scroll className="px-6">
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
            placeholder="Search projects and jobs..."
            placeholderTextColor="#9CA3AF"
            autoFocus={!params?.initialQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      <View className="flex-row mb-4" style={{ gap: 8 }}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            className="px-4 py-2 rounded-full border"
            style={{ backgroundColor: filter === f ? "#4F39F6" : "#fff", borderColor: filter === f ? "#4F39F6" : "#E5E7EB" }}
          >
            <Text className={filter === f ? "text-white font-medium capitalize text-xs" : "text-gray-600 capitalize text-xs"}>
              {f}
            </Text>
          </Pressable>
        ))}
      </View>

      {ready && !isLoading && !isError && (
        <Text className="text-gray-500 text-sm mb-3">{totalResults} Results Found</Text>
      )}

      {!ready ? (
        <EmptyState icon="search-outline" title="Start typing to search" subtitle="Find projects and jobs across CampusEduX." />
      ) : isLoading ? (
        <LoadingState label="Searching..." />
      ) : isError ? (
        <ErrorState message="Search failed. Please try again." onRetry={refetch} />
      ) : totalResults === 0 ? (
        <EmptyState title="No results found" subtitle={`We couldn't find anything for "${query}"`} />
      ) : (
        <View>
          {projects.map((project) => (
            <ProjectCard
              key={`p-${project.id}`}
              project={project}
              onPress={() =>
                (navigation.getParent() as any)?.navigate("Projects", { screen: "ProjectDetails", params: { projectId: project.id } })
              }
            />
          ))}
          {jobs.map((job) => (
            <JobCard
              key={`j-${job.id}`}
              job={job}
              onPress={() => (navigation.getParent() as any)?.navigate("Jobs", { screen: "JobDetails", params: { jobId: job.id } })}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

export default SearchResultScreen;
