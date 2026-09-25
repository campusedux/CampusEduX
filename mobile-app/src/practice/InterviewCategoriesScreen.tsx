import React from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, PressableScale, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useInterviewCategories } from "@/hooks/usePractice";
import { CARD_SHADOW } from "@/constants/theme";
import type { HomeStackParamList } from "@/types";
import { PracticeHeader } from "./practiceUi";

type Nav = NativeStackNavigationProp<HomeStackParamList, "InterviewCategories">;

export function InterviewCategoriesScreen() {
  const navigation = useNavigation<Nav>();
  const q = useInterviewCategories();

  return (
    <Screen>
      <PracticeHeader title="Interview Questions" onBack={() => navigation.goBack()} />
      {q.isLoading ? (
        <LoadingState label="Loading categories..." />
      ) : q.isError ? (
        <ErrorState message="Couldn't load interview questions." onRetry={() => q.refetch()} />
      ) : (
        <FlatList
          data={q.data ?? []}
          keyExtractor={(c) => c.slug}
          className="px-6"
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor="#4F39F6" />}
          ListEmptyComponent={
            <EmptyState icon="chatbubbles-outline" title="No interview questions yet" subtitle="Check back soon." />
          }
          renderItem={({ item }) => (
            <PressableScale
              onPress={() => navigation.navigate("InterviewTopics", { categorySlug: item.slug })}
              className="bg-white rounded-2xl border border-gray-100 p-4 mb-3 flex-row items-center"
              style={CARD_SHADOW}
            >
              <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#FCE7F3" }}>
                <Ionicons name="chatbubble-ellipses" size={22} color="#DB2777" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-gray-900" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={2}>
                  {item.topic_count} topic{item.topic_count === 1 ? "" : "s"}
                  {item.description ? ` • ${item.description}` : ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </PressableScale>
          )}
        />
      )}
    </Screen>
  );
}

export default InterviewCategoriesScreen;
