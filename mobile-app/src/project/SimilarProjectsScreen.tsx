import React, { useMemo } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { ProjectCard } from "@/components/cards";
import { useProjectDetail, useSimilarProjects, useToggleWishlist, useWishlist } from "@/hooks/useProjects";
import type { ProjectStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<ProjectStackParamList, "SimilarProjects">;
type Rte = RouteProp<ProjectStackParamList, "SimilarProjects">;

export function SimilarProjectsScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { data: project } = useProjectDetail(params.projectId);
  const { data, isLoading, isError, refetch } = useSimilarProjects(params.projectId, project?.categoryId);
  const { data: wishlist } = useWishlist();
  const wishlistedIds = useMemo(() => new Set((wishlist ?? []).map((p) => p.id)), [wishlist]);

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
          Similar Projects
        </Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading similar projects..." />
      ) : isError ? (
        <ErrorState message="Couldn't load similar projects." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No similar projects found" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <SimilarCard project={item} isWishlisted={wishlistedIds.has(item.id)} navigation={navigation} />
          )}
        />
      )}
    </Screen>
  );
}

function SimilarCard({ project, isWishlisted, navigation }: { project: any; isWishlisted: boolean; navigation: Nav }) {
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

export default SimilarProjectsScreen;
