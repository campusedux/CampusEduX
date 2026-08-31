import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState, RatingStars } from "@/components/ui";
import { useOwnedProjectDetail } from "@/hooks/useMyProjects";
import type { MyProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<MyProjectsStackParamList, "MyProjectDetails">;
type Rte = RouteProp<MyProjectsStackParamList, "MyProjectDetails">;

export function ProjectDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { data: owned, isLoading, isError, refetch } = useOwnedProjectDetail(params.orderId);

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Loading project..." /></Screen>;
  if (isError || !owned) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load this project." onRetry={refetch} /></Screen>;

  const { project } = owned;

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <View className="flex-row items-center" style={{ gap: 16 }}>
          <Ionicons name="heart-outline" size={22} color="#111827" />
          <Ionicons name="share-social-outline" size={20} color="#111827" />
        </View>
      </View>

      <View className="flex-row items-start mb-4">
        <View className="w-14 h-14 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
          <Ionicons name="cube-outline" size={26} color="#4F39F6" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center flex-wrap">
            <Text className="text-lg font-bold text-gray-900 mr-2" numberOfLines={2}>{project.title}</Text>
            <View className="bg-primary-50 rounded-full px-2 py-0.5" style={{ backgroundColor: "#EEF0FF" }}>
              <Text className="text-primary text-xs font-semibold">v{owned.purchasedVersion}</Text>
            </View>
          </View>
          <Text className="text-gray-400 text-sm mt-0.5">{project.categoryName}</Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <RatingStars rating={project.rating} size={14} />
          <Text className="text-gray-500 text-sm ml-2">
            {project.rating.toFixed(1)} ({project.reviewCount} Reviews)
          </Text>
        </View>
        <Text className="text-gray-400 text-sm">{project.salesCount}+ Sales</Text>
      </View>
      <Text className="text-xl font-bold text-primary mb-6">₹{project.price.toLocaleString("en-IN")}</Text>

      <View className="border border-gray-100 rounded-2xl p-4 mb-6">
        <DetailRow label="Purchased On" value={new Date(owned.purchasedAt).toLocaleDateString()} />
        <DetailRow label="License" value={owned.license} />
        <DetailRow
          label="Latest Version"
          value={owned.latestVersion}
          action={{ label: "View History", onPress: () => (navigation as any).navigate("VersionHistory", { projectId: project.id }) }}
        />
        <DetailRow label="Developer" value={owned.developerName} last />
      </View>

      {owned.isUpdateAvailable && (
        <Pressable
          onPress={() => (navigation as any).navigate("UpdateAvailable", { projectId: project.id })}
          className="flex-row items-center justify-between bg-amber-50 rounded-2xl p-4 mb-6"
        >
          <View className="flex-row items-center flex-1">
            <Ionicons name="rocket-outline" size={20} color="#B45309" />
            <Text className="text-amber-800 font-medium ml-2 flex-1">New version {owned.latestVersion} is available</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#B45309" />
        </Pressable>
      )}

      <Text className="font-bold text-gray-900 mb-2">About Project</Text>
      <Text className="text-gray-500 text-sm leading-5 mb-5">
        A complete {project.categoryName.toLowerCase()} project with production-ready source code, documentation, and lifetime updates.
      </Text>

      <Text className="font-bold text-gray-900 mb-2">Tech Stack</Text>
      <View className="flex-row flex-wrap mb-8" style={{ gap: 8 }}>
        {project.techStack.map((tech) => (
          <View key={tech} className="bg-gray-100 rounded-lg px-3 py-1.5">
            <Text className="text-gray-700 text-xs font-medium">{tech}</Text>
          </View>
        ))}
      </View>

      <Button label="Download Files" onPress={() => (navigation as any).navigate("DownloadFiles", { projectId: project.id })} className="mb-6" />
    </Screen>
  );
}

function DetailRow({ label, value, action, last }: { label: string; value: string; action?: { label: string; onPress: () => void }; last?: boolean }) {
  return (
    <View className={`flex-row items-center justify-between ${last ? "" : "mb-3"}`}>
      <Text className="text-gray-500 text-sm">{label}</Text>
      <View className="flex-row items-center">
        <Text className="text-gray-900 font-medium text-sm mr-2">{value}</Text>
        {action && (
          <Pressable onPress={action.onPress}>
            <Text className="text-primary text-xs font-medium">{action.label}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default ProjectDetailsScreen;
