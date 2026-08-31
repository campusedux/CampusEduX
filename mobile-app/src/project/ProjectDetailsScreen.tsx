import React from "react";
import { View, Text, Pressable, Image, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState, RatingStars } from "@/components/ui";
import { useProjectDetail, useToggleWishlist } from "@/hooks/useProjects";
import type { ProjectStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<ProjectStackParamList, "ProjectDetails">;
type Rte = RouteProp<ProjectStackParamList, "ProjectDetails">;

export function ProjectDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { data: project, isLoading, isError, refetch } = useProjectDetail(params.projectId);
  const toggleWishlist = useToggleWishlist(params.projectId);

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <LoadingState label="Loading project..." />
      </Screen>
    );
  }

  if (isError || !project) {
    return (
      <Screen className="items-center justify-center px-6">
        <ErrorState message="Couldn't load this project." onRetry={refetch} />
      </Screen>
    );
  }

  const heroImage = project.images[0] ?? null;

  return (
    <Screen>
      <ScrollView>
        <View className="relative">
          <Pressable
            onPress={() => project.images.length > 0 && (navigation as any).navigate("ImageGallery", { images: project.images })}
            className="w-full items-center justify-center"
            style={{ height: 220, backgroundColor: "#EEF0FF" }}
          >
            {heroImage ? (
              <Image source={{ uri: heroImage }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Ionicons name="cube-outline" size={64} color="#4F39F6" />
            )}
          </Pressable>

          <View className="absolute top-12 left-6 right-6 flex-row items-center justify-between">
            <Pressable onPress={() => navigation.goBack()} className="w-9 h-9 rounded-full bg-white items-center justify-center">
              <Ionicons name="arrow-back" size={20} color="#111827" />
            </Pressable>
            <View className="flex-row" style={{ gap: 10 }}>
              <Pressable
                onPress={() => toggleWishlist.mutate(project.isWishlisted)}
                className="w-9 h-9 rounded-full bg-white items-center justify-center"
              >
                <Ionicons name={project.isWishlisted ? "heart" : "heart-outline"} size={18} color={project.isWishlisted ? "#DC2626" : "#111827"} />
              </Pressable>
              <Pressable className="w-9 h-9 rounded-full bg-white items-center justify-center">
                <Ionicons name="share-social-outline" size={18} color="#111827" />
              </Pressable>
            </View>
          </View>
        </View>

        <View className="px-6 pt-5">
          <View className="flex-row items-start justify-between mb-1">
            <Text className="text-xl font-bold text-gray-900 flex-1 mr-3">{project.title}</Text>
            <Text className="text-xl font-bold text-primary">₹{project.price}</Text>
          </View>
          <Text className="text-gray-400 text-sm mb-3">{project.categoryName}</Text>

          <Pressable
            onPress={() => (navigation as any).navigate("Reviews", { projectId: project.id, title: project.title })}
            className="flex-row items-center mb-4"
          >
            <RatingStars rating={project.rating} />
            <Text className="text-gray-500 text-sm ml-2">
              {project.rating.toFixed(1)} ({project.reviewCount} Reviews)
            </Text>
          </Pressable>

          {(project.videoUrl || project.liveDemoUrl) && (
            <View className="flex-row mb-5" style={{ gap: 10 }}>
              {project.videoUrl && (
                <Pressable
                  onPress={() => (navigation as any).navigate("VideoPreview", { projectId: project.id, videoUrl: project.videoUrl as string, title: project.title })}
                  className="flex-1 flex-row items-center justify-center border border-gray-200 rounded-xl py-3"
                >
                  <Ionicons name="play-circle-outline" size={18} color="#4F39F6" />
                  <Text className="text-primary font-medium ml-2">Watch Preview</Text>
                </Pressable>
              )}
              {project.liveDemoUrl && (
                <Pressable
                  onPress={() => (navigation as any).navigate("LiveDemo", { projectId: project.id, demoUrl: project.liveDemoUrl as string, title: project.title })}
                  className="flex-1 flex-row items-center justify-center border border-gray-200 rounded-xl py-3"
                >
                  <Ionicons name="globe-outline" size={18} color="#4F39F6" />
                  <Text className="text-primary font-medium ml-2">Live Demo</Text>
                </Pressable>
              )}
            </View>
          )}

          <Text className="font-bold text-gray-900 mb-2">About Project</Text>
          <Text className="text-gray-500 text-sm leading-5 mb-4">
            {project.description || "No description provided for this project yet."}
          </Text>

          <Text className="font-bold text-gray-900 mb-2">Tech Stack</Text>
          <View className="flex-row flex-wrap mb-6" style={{ gap: 8 }}>
            {project.techStack.map((tech) => (
              <View key={tech} className="bg-gray-100 rounded-lg px-3 py-1.5">
                <Text className="text-gray-700 text-xs font-medium">{tech}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => (navigation as any).navigate("SimilarProjects", { projectId: project.id, title: project.title })}
            className="flex-row items-center justify-between border-t border-gray-100 py-4 mb-4"
          >
            <Text className="font-semibold text-gray-900">View Similar Projects</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>
        </View>
      </ScrollView>

      <View className="flex-row px-6 py-4 border-t border-gray-100" style={{ gap: 12 }}>
        <Button
          label="Add to Wishlist"
          variant="outline"
          className="flex-1"
          onPress={() => toggleWishlist.mutate(project.isWishlisted)}
        />
        <Button label="Buy Now" className="flex-1" onPress={() => (navigation as any).navigate("BuyNow", { projectId: project.id })} />
      </View>
    </Screen>
  );
}

export default ProjectDetailsScreen;
