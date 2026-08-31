import React, { useMemo } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { ProjectCard } from "@/components/cards";
import { useCategoryProjects, useToggleWishlist, useWishlist } from "@/hooks/useProjects";
import type { ProjectStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<ProjectStackParamList, "CategoryProjects">;
type Rte = RouteProp<ProjectStackParamList, "CategoryProjects">;

export function CategoryProjectsScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { data, isLoading, isError, refetch } = useCategoryProjects(params.categoryId);
  const { data: wishlist } = useWishlist();
  const wishlistedIds = useMemo(() => new Set((wishlist ?? []).map((p) => p.id)), [wishlist]);

  return (
    <Screen className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <View className="flex-row items-center flex-1">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
            {params.categoryName}
          </Text>
        </View>
        <Text className="text-gray-400 text-sm">{data?.length ?? 0} Projects found</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading projects..." />
      ) : isError ? (
        <ErrorState message="Couldn't load projects." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="cube-outline" title="No projects in this category yet" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <ProjectCardWithWishlist
              project={item}
              isWishlisted={wishlistedIds.has(item.id)}
              onPress={() => (navigation as any).navigate("ProjectDetails", { projectId: item.id })}
            />
          )}
        />
      )}
    </Screen>
  );
}

function ProjectCardWithWishlist({ project, isWishlisted, onPress }: { project: any; isWishlisted: boolean; onPress: () => void }) {
  const toggleWishlist = useToggleWishlist(project.id);
  return (
    <ProjectCard
      project={project}
      isWishlisted={isWishlisted}
      onToggleWishlist={() => toggleWishlist.mutate(isWishlisted)}
      onPress={onPress}
    />
  );
}

export default CategoryProjectsScreen;
