import React, { useState } from "react";
import { View, Text } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen, HeaderIconButton, SearchBar, Chip, SectionHeader, SkeletonList, ErrorState, EmptyState } from "@/components/ui";
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
      <View className="flex-row items-center mt-2 mb-4" style={{ gap: 10 }}>
        <HeaderIconButton icon="arrow-back" label="Go back" onPress={() => navigation.goBack()} />
        <View className="flex-1">
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onClear={() => setQuery("")}
            placeholder="Search projects and jobs..."
            autoFocus={!params?.initialQuery}
          />
        </View>
      </View>

      <View className="flex-row flex-wrap">
        {FILTERS.map((f) => (
          <Chip
            key={f}
            label={f.charAt(0).toUpperCase() + f.slice(1)}
            active={filter === f}
            count={ready && data ? (f === "all" ? data.projects.length + data.jobs.length : data[f].length) : undefined}
            onPress={() => setFilter(f)}
          />
        ))}
      </View>

      {ready && !isLoading && !isError && (
        <Text className="text-gray-600 text-sm mb-3">{totalResults} Results Found</Text>
      )}

      {!ready ? (
        <EmptyState icon="search-outline" title="Start typing to search" subtitle="Find projects and jobs across CampusEduX." />
      ) : isLoading ? (
        <SkeletonList count={4} />
      ) : isError ? (
        <ErrorState message="Search failed. Please try again." onRetry={refetch} />
      ) : totalResults === 0 ? (
        <EmptyState icon="search-outline" accent="orange" title={`No results for "${query.trim()}"`} subtitle="Try a different spelling or a shorter keyword." />
      ) : (
        <View>
          {filter === "all" && projects.length > 0 && jobs.length > 0 ? <SectionHeader title="Projects" accent="violet" /> : null}
          {projects.map((project) => (
            <ProjectCard
              key={`p-${project.id}`}
              project={project}
              onPress={() =>
                (navigation.getParent() as any)?.navigate("Projects", { screen: "ProjectDetails", params: { projectId: project.id } })
              }
            />
          ))}
          {filter === "all" && projects.length > 0 && jobs.length > 0 ? <SectionHeader title="Jobs" accent="blue" /> : null}
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
