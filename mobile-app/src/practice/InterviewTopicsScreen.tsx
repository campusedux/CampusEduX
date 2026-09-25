import React from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, PressableScale, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useInterviewTopics } from "@/hooks/usePractice";
import { CARD_SHADOW } from "@/constants/theme";
import type { HomeStackParamList } from "@/types";
import { PracticeHeader } from "./practiceUi";

type Nav = NativeStackNavigationProp<HomeStackParamList, "InterviewTopics">;
type Rte = RouteProp<HomeStackParamList, "InterviewTopics">;

export function InterviewTopicsScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const q = useInterviewTopics(params.categorySlug);

  return (
    <Screen>
      <PracticeHeader title={q.data ? `${q.data.category.name} Interview Questions` : "Interview Questions"} onBack={() => navigation.goBack()} />
      {q.isLoading ? (
        <LoadingState label="Loading topics..." />
      ) : q.isError ? (
        <ErrorState message="Couldn't load topics." onRetry={() => q.refetch()} />
      ) : !q.data ? (
        <EmptyState icon="chatbubbles-outline" title="Category not available" />
      ) : (
        <FlatList
          data={q.data.topics}
          keyExtractor={(t) => t.slug}
          className="px-6"
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor="#4F39F6" />}
          ListEmptyComponent={<EmptyState icon="chatbubbles-outline" title="No topics yet" subtitle="Check back soon." />}
          renderItem={({ item }) => (
            <PressableScale
              onPress={() =>
                navigation.navigate("InterviewTopic", { categorySlug: params.categorySlug, topicSlug: item.slug })
              }
              className="bg-white rounded-2xl border border-gray-100 p-4 mb-3 flex-row items-center"
              style={CARD_SHADOW}
            >
              <View className="flex-1">
                <Text className="font-bold text-gray-900" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={2}>
                  {item.question_count} question{item.question_count === 1 ? "" : "s"}
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

export default InterviewTopicsScreen;
