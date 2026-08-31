import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useAptitudeTopics } from "@/hooks/usePlacement";
import type { AptitudeCategory } from "@/types";
import type { UseQueryResult } from "@tanstack/react-query";

interface Props {
  title: string;
  category: AptitudeCategory;
}

/**
 * Shared layout for Quantitative / Logical Reasoning / Verbal Ability
 * (Module 5 screens 3-5) — identical topic-progress list, differing only
 * by category.
 */
export function AptitudeTopicListTemplate({ title, category }: Props) {
  const navigation = useNavigation();
  const { data, isLoading, isError, refetch }: UseQueryResult<any> = useAptitudeTopics(category);

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">{title}</Text>
      </View>

      <Text className="text-gray-400 text-sm mb-3">Topics</Text>

      {isLoading ? (
        <LoadingState label="Loading topics..." />
      ) : isError ? (
        <ErrorState message="Couldn't load topics." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No topics yet" />
      ) : (
        data.map((topic: any) => {
          const pct = topic.totalQuestions > 0 ? Math.round((topic.solvedQuestions / topic.totalQuestions) * 100) : 0;
          return (
            <Pressable
              key={topic.id}
              onPress={() => (navigation as any).navigate("PracticeTestList", { category })}
              className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 mb-3"
            >
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">{topic.name}</Text>
                <View className="flex-row items-center mt-2">
                  <View className="flex-1 h-1.5 bg-gray-100 rounded-full mr-2">
                    <View className="h-1.5 bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </View>
                  <Text className="text-gray-400 text-xs">
                    {topic.solvedQuestions}/{topic.totalQuestions}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" style={{ marginLeft: 12 }} />
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}
