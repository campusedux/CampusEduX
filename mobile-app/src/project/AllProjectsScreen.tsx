import React, { useState, useMemo } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState, DrawerMenuButton } from "@/components/ui";
import { ProjectCard } from "@/components/cards";
import { CustomProjectBanner } from "@/components/CustomProjectBanner";
import { useAllProjects , useToggleWishlist, useWishlist } from "@/hooks/useProjects";
import { useCategories } from "@/hooks/useHomeData";
import { useProjectFilterStore } from "@/store/projectFilterStore";
import { useAuthStore } from "@/store/authStore";
import { academicFromUser, academicEmptyText } from "@/lib/personalization";
import type { Project, ProjectStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<ProjectStackParamList, "AllProjects">;

export function AllProjectsScreen() {
  const navigation = useNavigation<Nav>();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const { filters } = useProjectFilterStore();
  const academic = academicFromUser(useAuthStore((s) => s.user));
  const { data: categories } = useCategories();
  const { data: wishlist } = useWishlist();
  const wishlistedIds = useMemo(() => new Set((wishlist ?? []).map((p) => p.id)), [wishlist]);

  const effectiveFilters = { ...filters, categoryId: activeCategoryId ?? filters.categoryId };
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useAllProjects(effectiveFilters);
  const projects = data?.pages.flatMap((p) => p.projects) ?? [];

  return (
    <Screen className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <DrawerMenuButton />
          <Text className="text-xl font-bold text-gray-900">All Projects</Text>
        </View>
        <View className="flex-row" style={{ gap: 16 }}>
          <Pressable onPress={() => (navigation as any).navigate("SearchProjects")}>
            <Ionicons name="search-outline" size={22} color="#111827" />
          </Pressable>
          <Pressable onPress={() => (navigation as any).navigate("FilterProjects")}>
            <Ionicons name="options-outline" size={22} color="#111827" />
          </Pressable>
        </View>
      </View>

      <CustomProjectBanner
        onStartProject={() => (navigation.getParent() as any)?.navigate("CustomProjects", { screen: "BuilderStart" })}
        onLearnMore={() => (navigation.getParent() as any)?.navigate("CustomProjects", { screen: "BuilderStart" })}
      />

      <View className="mb-4">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, name: "All" }, ...(categories ?? [])]}
          keyExtractor={(item) => item.id ?? "all"}
          renderItem={({ item }) => {
            const isActive = activeCategoryId === item.id;
            return (
              <Pressable
                onPress={() => setActiveCategoryId(item.id)}
                className="px-4 py-2 rounded-full border mr-2"
                style={{ backgroundColor: isActive ? "#4F39F6" : "#fff", borderColor: isActive ? "#4F39F6" : "#E5E7EB" }}
              >
                <Text className={isActive ? "text-white font-medium" : "text-gray-600"}>{item.name}</Text>
              </Pressable>
            );
          }}
        />
      </View>

      {!isLoading && !isError && projects.length > 0 && (
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-gray-500 text-sm">{projects.length} projects found</Text>
          <Pressable onPress={() => (navigation as any).navigate("FilterProjects")} className="flex-row items-center">
            <Text className="text-gray-700 text-sm font-medium mr-1">Sort</Text>
            <Ionicons name="chevron-down" size={14} color="#6B7280" />
          </Pressable>
        </View>
      )}

      {isLoading ? (
        <LoadingState label="Loading projects..." />
      ) : isError ? (
        <ErrorState message="Couldn't load projects." onRetry={refetch} />
      ) : projects.length === 0 ? (
        <EmptyState icon="cube-outline" title="No projects found" subtitle={academicEmptyText(academic, "projects")} />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={isFetchingNextPage ? <LoadingState label="Loading more..." /> : null}
          renderItem={({ item }) => (
            <ProjectItem project={item} isWishlisted={wishlistedIds.has(item.id)} navigation={navigation} />
          )}
        />
      )}
    </Screen>
  );
}

function ProjectItem({
  project,
  isWishlisted,
  navigation,
}: {
  project: Project;
  isWishlisted: boolean;
  navigation: Nav;
}) {
  const toggleWishlist = useToggleWishlist(project.id);
  return (
    <ProjectCard
      project={project}
      isWishlisted={isWishlisted}
      onToggleWishlist={() => toggleWishlist.mutate(isWishlisted)}
      onPress={(p) => (navigation as any).navigate("ProjectDetails", { projectId: p.id })}
    />
  );
}

export default AllProjectsScreen;
