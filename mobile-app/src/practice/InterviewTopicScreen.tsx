import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { MarkdownText } from "@/components/learning/MarkdownText";
import { useInterviewTopic } from "@/hooks/usePractice";
import type { HomeStackParamList } from "@/types";
import { DifficultyPill, PracticeHeader } from "./practiceUi";

type Nav = NativeStackNavigationProp<HomeStackParamList, "InterviewTopic">;
type Rte = RouteProp<HomeStackParamList, "InterviewTopic">;

export function InterviewTopicScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const q = useInterviewTopic(params.categorySlug, params.topicSlug);
  const [open, setOpen] = useState<Record<number, boolean>>({});

  const questions = q.data?.questions ?? [];
  const allOpen = questions.length > 0 && questions.every((_, i) => open[i]);
  const toggleAll = () => setOpen(allOpen ? {} : Object.fromEntries(questions.map((_, i) => [i, true])));

  // prev/next replace the current screen so Back still returns to the topic list.
  const goTopic = (topicSlug: string) => {
    setOpen({});
    navigation.replace("InterviewTopic", { categorySlug: params.categorySlug, topicSlug });
  };

  return (
    <Screen>
      <PracticeHeader title={q.data?.topic.name ?? "Interview Questions"} onBack={() => navigation.goBack()} />
      {q.isLoading ? (
        <LoadingState label="Loading questions..." />
      ) : q.isError ? (
        <ErrorState message="Couldn't load these questions." onRetry={() => q.refetch()} />
      ) : !q.data ? (
        <EmptyState icon="chatbubbles-outline" title="Topic not available" />
      ) : (
        <ScrollView
          className="px-6"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor="#4F39F6" />}
        >
          {q.data.topic.description ? (
            <Text className="text-gray-500 text-sm mb-3">{q.data.topic.description}</Text>
          ) : null}

          {questions.length === 0 ? (
            <EmptyState icon="chatbubbles-outline" title="No questions yet" subtitle="Questions for this topic are being added." />
          ) : (
            <>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-500 text-sm">
                  {questions.length} question{questions.length === 1 ? "" : "s"}
                </Text>
                <Pressable onPress={toggleAll} hitSlop={8}>
                  <Text className="text-primary text-sm font-medium">{allOpen ? "Collapse all" : "Expand all"}</Text>
                </Pressable>
              </View>

              {questions.map((item, i) => {
                const isOpen = !!open[i];
                return (
                  <View key={i} className="bg-white rounded-2xl border border-gray-100 mb-3 overflow-hidden">
                    <Pressable
                      onPress={() => setOpen((prev) => ({ ...prev, [i]: !prev[i] }))}
                      className="p-4 flex-row items-start"
                    >
                      <View className="flex-1 pr-2">
                        <Text className="text-gray-400 text-[11px] mb-1">Question {i + 1}</Text>
                        <Text className="font-semibold text-gray-900 text-[15px] leading-5">{item.question}</Text>
                        <View className="flex-row mt-2">
                          <DifficultyPill difficulty={item.difficulty} />
                        </View>
                      </View>
                      <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color="#9CA3AF" style={{ marginTop: 2 }} />
                    </Pressable>

                    {isOpen ? (
                      <View className="px-4 pb-4 border-t border-gray-100 pt-3">
                        <Text className="text-[11px] font-semibold text-gray-400 uppercase mb-1">Ans</Text>
                        <MarkdownText source={item.answer} />
                        {item.example ? (
                          <View className="mt-3">
                            <Text className="text-[11px] font-semibold text-gray-400 uppercase mb-1">Example</Text>
                            <MarkdownText source={item.example} />
                          </View>
                        ) : null}
                        {item.important_point ? (
                          <View className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5">
                            <Text className="text-[11px] font-semibold text-amber-700 uppercase">Important Point</Text>
                            <Text className="text-amber-900 text-sm mt-1 leading-5">{item.important_point}</Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </>
          )}

          <View className="flex-row mt-4" style={{ gap: 12 }}>
            {q.data.prev ? (
              <Pressable onPress={() => goTopic(q.data!.prev!.slug)} className="flex-1 rounded-xl border border-gray-200 p-3">
                <Text className="text-gray-400 text-xs">Previous Topic</Text>
                <Text className="text-gray-900 text-sm font-semibold mt-0.5" numberOfLines={2}>
                  {q.data.prev.name}
                </Text>
              </Pressable>
            ) : (
              <View className="flex-1" />
            )}
            {q.data.next ? (
              <Pressable
                onPress={() => goTopic(q.data!.next!.slug)}
                className="flex-1 rounded-xl border border-gray-200 p-3 items-end"
              >
                <Text className="text-gray-400 text-xs">Next Topic</Text>
                <Text className="text-gray-900 text-sm font-semibold mt-0.5 text-right" numberOfLines={2}>
                  {q.data.next.name}
                </Text>
              </Pressable>
            ) : (
              <View className="flex-1" />
            )}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

export default InterviewTopicScreen;
