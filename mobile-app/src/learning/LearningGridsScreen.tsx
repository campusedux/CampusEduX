import React, { useState } from "react";
import { View, Text, Pressable, TextInput, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState, PressableScale } from "@/components/ui";
import { useLearningGrids, useLearningSearch } from "@/hooks/useLearning";
import { CARD_SHADOW } from "@/constants/theme";
import type { LearningGridCard, PlacementStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<PlacementStackParamList, "LearningGrids">;

function isEmoji(s: string | null): boolean {
  return !!s && /\p{Extended_Pictographic}/u.test(s);
}

export function LearningGridsScreen() {
  const navigation = useNavigation<Nav>();
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch, isRefetching } = useLearningGrids();
  const { data: hits, isFetching: searching } = useLearningSearch(search);
  const showingSearch = search.trim().length > 1;

  const openGrid = (grid: LearningGridCard) => {
    navigation.navigate("LearningGrid", { gridSlug: grid.slug, gridName: grid.name });
  };

  return (
    <Screen className="px-0">
      <View className="px-6">
        <View className="flex-row items-center mt-2 mb-4">
          <Pressable onPress={() => navigation.goBack()} className="mr-3" hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">Learning</Text>
        </View>

        <View className="flex-row items-center border border-gray-200 rounded-xl px-3 mb-3" style={{ height: 46 }}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-gray-900"
            placeholder="Search topics and resources..."
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search ? (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {showingSearch ? (
        <View className="flex-1 px-6">
          {searching && !hits ? (
            <LoadingState label="Searching..." />
          ) : !hits || hits.length === 0 ? (
            <EmptyState icon="search-outline" title="No matches" subtitle="Try a different word." />
          ) : (
            <FlatList
              data={hits}
              keyExtractor={(h, idx) => `${h.grid_slug}-${h.topic_slug ?? "grid"}-${idx}`}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item }) => (
                <PressableScale
                  onPress={() =>
                    item.kind === "grid" || !item.topic_slug
                      ? navigation.navigate("LearningGrid", { gridSlug: item.grid_slug, gridName: item.grid_name })
                      : navigation.navigate("LearningTopic", {
                          gridSlug: item.grid_slug,
                          topicSlug: item.topic_slug,
                          topicTitle: item.title,
                        })
                  }
                  className="bg-white border border-gray-100 rounded-2xl p-4 mb-2"
                  style={CARD_SHADOW}
                >
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <Ionicons
                      name={item.kind === "grid" ? "grid-outline" : "document-text-outline"}
                      size={14}
                      color="#4F39F6"
                    />
                    <Text className="text-[15px] font-semibold text-gray-900 flex-1" numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.is_premium ? <Ionicons name="lock-closed" size={12} color="#B45309" /> : null}
                  </View>
                  <Text className="text-gray-400 text-xs mt-0.5">
                    {item.grid_name}
                    {item.section_name ? ` · ${item.section_name}` : ""}
                  </Text>
                  {item.snippet ? (
                    <Text className="text-gray-500 text-xs mt-1" numberOfLines={2}>
                      {item.snippet}
                    </Text>
                  ) : null}
                </PressableScale>
              )}
            />
          )}
        </View>
      ) : isLoading ? (
        <View className="px-6 pt-10">
          <LoadingState label="Loading resources..." />
        </View>
      ) : isError ? (
        <View className="px-6 pt-10">
          <ErrorState message="Couldn't load learning resources." onRetry={refetch} />
        </View>
      ) : !data || data.length === 0 ? (
        <View className="px-6 pt-10">
          <EmptyState
            icon="library-outline"
            title="No learning resources yet"
            subtitle="New resources appear here as soon as they're published."
          />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(g) => g.id}
          contentContainerStyle={{ padding: 24, paddingTop: 8 }}
          onRefresh={refetch}
          refreshing={isRefetching}
          renderItem={({ item }) => (
            <GridCard grid={item} onPress={() => openGrid(item)} />
          )}
        />
      )}
    </Screen>
  );
}

function GridCard({ grid, onPress }: { grid: LearningGridCard; onPress: () => void }) {
  const tint = grid.accent_color || "#4F39F6";
  return (
    <PressableScale
      onPress={onPress}
      className="bg-white border border-gray-100 rounded-2xl p-4 mb-3"
      style={CARD_SHADOW}
    >
      <View className="flex-row items-center" style={{ gap: 12 }}>
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center"
          style={{ backgroundColor: `${tint}1A` }}
        >
          {isEmoji(grid.icon) ? (
            <Text style={{ fontSize: 22 }}>{grid.icon}</Text>
          ) : (
            <Ionicons name="book-outline" size={22} color={tint} />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-semibold text-gray-900" numberOfLines={1}>
            {grid.name}
          </Text>
          <Text className="text-gray-400 text-xs mt-0.5">
            {grid.section_count} section{grid.section_count === 1 ? "" : "s"} · {grid.topic_count} topic
            {grid.topic_count === 1 ? "" : "s"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </View>
      {grid.description ? (
        <Text className="text-gray-500 text-sm mt-3" numberOfLines={2}>
          {grid.description}
        </Text>
      ) : null}
    </PressableScale>
  );
}

export default LearningGridsScreen;
