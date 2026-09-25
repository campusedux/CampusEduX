import React, { useMemo, useState } from "react";
import { View, Text, Pressable, TextInput, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useOwnedProjects } from "@/hooks/useMyProjects";
import type { MyProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<MyProjectsStackParamList, "PurchasedProjects">;
type Tab = "purchased" | "wishlist" | "collections";

export function PurchasedProjectsScreen() {
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<Tab>("purchased");
  const [query, setQuery] = useState("");
  const { data, isLoading, isError, refetch } = useOwnedProjects(tab);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!query.trim()) return data;
    return data.filter((item) => item.project.title.toLowerCase().includes(query.trim().toLowerCase()));
  }, [data, query]);

  return (
    <Screen className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <Text className="text-xl font-bold text-gray-900">My Projects</Text>
        <Ionicons name="notifications-outline" size={22} color="#111827" />
      </View>

      <View className="flex-row mb-4" style={{ gap: 8 }}>
        {(["purchased", "wishlist", "collections"] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            className="px-4 py-2 rounded-full border"
            style={{ backgroundColor: tab === t ? "#4F39F6" : "#fff", borderColor: tab === t ? "#4F39F6" : "#E5E7EB" }}
          >
            <Text className={tab === t ? "text-white font-medium capitalize" : "text-gray-600 capitalize"}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 mb-2" style={{ height: 44 }}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          className="flex-1 ml-2 text-gray-900"
          value={query}
          onChangeText={setQuery}
          placeholder="Search projects..."
          placeholderTextColor="#9CA3AF"
        />
        <Ionicons name="options-outline" size={18} color="#9CA3AF" />
      </View>

      {isLoading ? (
        <LoadingState label="Loading your projects..." />
      ) : isError ? (
        <ErrorState message="Couldn't load your projects." onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={tab === "wishlist" ? "heart-outline" : "folder-open-outline"}
          title={tab === "wishlist" ? "Your wishlist is empty" : "No projects yet"}
          subtitle={tab === "purchased" ? "Projects you buy will show up here." : undefined}
        />
      ) : (
        <>
          <Text className="text-gray-400 text-sm mb-2">{filtered.length} Projects</Text>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.orderId}
            renderItem={({ item }) => {
              // Wishlisted project that was unpublished/removed: greyed, not openable (manage it in Wishlist).
              const gone = tab === "wishlist" && item.project.available === false;
              return (
              <View className="flex-row items-center border border-gray-100 rounded-2xl p-3 mb-3" style={gone ? { opacity: 0.6 } : undefined} testID={gone ? "wishlist-unavailable" : undefined}>
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
                  <Ionicons name="cube-outline" size={22} color="#4F39F6" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900" numberOfLines={1}>{item.project.title}</Text>
                  <Text className="text-gray-400 text-xs mt-0.5">
                    {tab === "wishlist" ? item.project.categoryName : `Purchased on ${new Date(item.purchasedAt).toLocaleDateString()}`}
                  </Text>
                </View>
                {gone ? null : <Button
                  label={tab === "wishlist" ? "View" : "View"}
                  variant="outline"
                  onPress={() =>
                    tab === "wishlist"
                      ? (navigation.getParent() as any)?.navigate("MainTabs", { screen: "Projects", params: { screen: "ProjectDetails", params: { projectId: item.project.id } } })
                      : (navigation as any).navigate("MyProjectDetails", { orderId: item.orderId })
                  }
                />}
              </View>
              );
            }}
          />
        </>
      )}
    </Screen>
  );
}

export default PurchasedProjectsScreen;
