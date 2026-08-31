import React from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { ProjectCard } from "@/components/cards";
import { useWishlist, useToggleWishlist } from "@/hooks/useProjects";
import type { ProjectStackParamList, Project } from "@/types";

type Nav = NativeStackNavigationProp<ProjectStackParamList, "Wishlist">;

export function WishlistScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useWishlist();

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">My Wishlist</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading wishlist..." />
      ) : isError ? (
        <ErrorState message="Couldn't load your wishlist." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="heart-outline" title="Your wishlist is empty" subtitle="Tap the heart icon on any project to save it here." />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => <WishlistCard project={item} navigation={navigation} />}
        />
      )}
    </Screen>
  );
}

function WishlistCard({ project, navigation }: { project: Project; navigation: Nav }) {
  const toggleWishlist = useToggleWishlist(project.id);
  return (
    <ProjectCard
      project={project}
      isWishlisted
      onToggleWishlist={() => toggleWishlist.mutate(true)}
      onPress={(p) => (navigation as any).navigate("ProjectDetails", { projectId: p.id })}
    />
  );
}

export default WishlistScreen;
