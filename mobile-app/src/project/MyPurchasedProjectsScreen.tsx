import React, { useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { usePurchasedProjects } from "@/hooks/useProjects";
import type { ProjectStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<ProjectStackParamList, "MyPurchasedProjects">;
type Filter = "all" | "active" | "completed";

export function MyPurchasedProjectsScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = usePurchasedProjects();
  const [filter, setFilter] = useState<Filter>("all");

  // "Active" vs "Completed" reflects whether the project has since received
  // a newer version than what the user downloaded — simplified here to "all"
  // until Module 7's version-history data model is wired in.
  const filtered = data ?? [];

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">My Purchased Projects</Text>
      </View>

      <View className="flex-row mb-4" style={{ gap: 8 }}>
        {(["all", "active", "completed"] as Filter[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            className="px-4 py-2 rounded-full border"
            style={{ backgroundColor: filter === f ? "#4F39F6" : "#fff", borderColor: filter === f ? "#4F39F6" : "#E5E7EB" }}
          >
            <Text className={filter === f ? "text-white font-medium capitalize" : "text-gray-600 capitalize"}>{f}</Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <LoadingState label="Loading your projects..." />
      ) : isError ? (
        <ErrorState message="Couldn't load your purchases." onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="bag-outline" title="No purchased projects yet" subtitle="Projects you buy will show up here." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.orderId}
          renderItem={({ item }) => (
            <View className="flex-row items-center border border-gray-100 rounded-2xl p-3 mb-3">
              <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
                <Ionicons name="cube-outline" size={22} color="#4F39F6" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900" numberOfLines={1}>{item.project.title}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">Purchased on {new Date(item.purchasedAt).toLocaleDateString()}</Text>
              </View>
              <Button label="Download" variant="outline" onPress={() => (navigation as any).navigate("DownloadProject", { projectId: item.project.id })} />
            </View>
          )}
        />
      )}
    </Screen>
  );
}

export default MyPurchasedProjectsScreen;
