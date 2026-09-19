import React, { useState } from "react";
import { View, Text, Pressable, TextInput, FlatList } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { ProjectCard } from "@/components/cards";
import { useSearchProjects, useToggleWishlist, useWishlist } from "@/hooks/useProjects";
import type { ProjectStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<ProjectStackParamList, "SearchProjects">;
type Rte = RouteProp<ProjectStackParamList, "SearchProjects">;

export function SearchProjectsScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const [query, setQuery] = useState(params?.initialQuery ?? "");

  const { data, isLoading, isError, refetch } = useSearchProjects(query);
  const { data: wishlist } = useWishlist();
  const wishlistedIds = new Set((wishlist ?? []).map((p) => p.id));

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <View className="flex-1 flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3" style={{ height: 44 }}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-gray-900"
            value={query}
            onChangeText={setQuery}
            placeholder="Search projects..."
            placeholderTextColor="#9CA3AF"
            autoFocus={!params?.initialQuery}
          />
        </View>
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} className="ml-2">
            <Text className="text-gray-500">Cancel</Text>
          </Pressable>
        )}
      </View>

      {query.trim().length > 1 && (
        <Text className="text-gray-400 text-sm mb-3">{data?.length ?? 0} results found</Text>
      )}

      {query.trim().length < 2 ? (
        <EmptyState icon="search-outline" title="Search for a project" subtitle="Try a title, technology, or category." />
      ) : isLoading ? (
        <LoadingState label="Searching..." />
      ) : isError ? (
        <ErrorState message="Search failed." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="search-outline" title={`No results for "${query.trim()}"`} subtitle="Try a different spelling or a shorter keyword." />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <SearchResultCard projectId={item.id} project={item} isWishlisted={wishlistedIds.has(item.id)} navigation={navigation} />
          )}
        />
      )}
    </Screen>
  );
}

function SearchResultCard({ project, isWishlisted, navigation }: { projectId: string; project: any; isWishlisted: boolean; navigation: Nav }) {
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

export default SearchProjectsScreen;
