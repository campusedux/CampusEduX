import React, { useEffect } from "react";
import { View, Text, Pressable, ScrollView, Linking } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { MarkdownText } from "@/components/learning/MarkdownText";
import { notify } from "@/lib/notify";
import {
  useLearningTopic,
  useLearningBookmarks,
  useToggleLearningBookmark,
  useTopicPractice,
} from "@/hooks/useLearning";
import { useAuthStore } from "@/store/authStore";
import { useProgressActions } from "@/learning/progress/progressStore";
import { useReadingActivity } from "@/hooks/useReadingActivity";
import type { PlacementStackParamList, TopicMockTestCard, TopicCodingProblemCard } from "@/types";

type Nav = NativeStackNavigationProp<PlacementStackParamList, "LearningTopic">;
type Rte = RouteProp<PlacementStackParamList, "LearningTopic">;

export function LearningTopicScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const userId = useAuthStore((s) => s.user?.id);
  const isPremiumUser = useAuthStore((s) => s.user?.isPremium ?? false);
  const { data, isLoading, isError, refetch } = useLearningTopic(params.gridSlug, params.topicSlug);
  const { data: bookmarks } = useLearningBookmarks();
  const toggleBookmark = useToggleLearningBookmark();
  const { data: practice } = useTopicPractice(params.gridSlug, params.topicSlug);

  // Feeds the Learning Home "Continue Learning" card + the daily-streak rule
  // (≥ 60 s on a readable topic). Locked (premium-gated) topics aren't recorded.
  const { markOpened } = useProgressActions();
  const readable = !!data && !data.locked;
  useEffect(() => {
    if (!data || data.locked) return;
    markOpened({
      gridSlug: params.gridSlug,
      gridName: data.grid.name,
      topicSlug: params.topicSlug,
      topicTitle: data.topic.title,
      sectionName: data.section.name,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.topic.id, data?.locked, params.gridSlug, params.topicSlug]);
  useReadingActivity(data?.topic.id, readable);

  const openUrl = (url: string) => Linking.openURL(url).catch(() => notify("Couldn't open link"));

  return (
    <Screen className="px-0">
      <View className="flex-row items-center justify-between px-6 mt-2 mb-2">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        {data && userId ? (
          <Pressable
            hitSlop={8}
            onPress={() =>
              toggleBookmark.mutate({
                topicId: data.topic.id,
                isBookmarked: bookmarks?.has(data.topic.id) ?? false,
              })
            }
          >
            <Ionicons
              name={bookmarks?.has(data.topic.id) ? "bookmark" : "bookmark-outline"}
              size={22}
              color={bookmarks?.has(data.topic.id) ? "#4F39F6" : "#111827"}
            />
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <View className="items-center justify-center flex-1">
          <LoadingState label="Loading topic..." />
        </View>
      ) : isError ? (
        <View className="items-center justify-center flex-1 px-6">
          <ErrorState message="Couldn't load this topic." onRetry={refetch} />
        </View>
      ) : !data ? (
        <View className="items-center justify-center flex-1 px-6">
          <ErrorState message="This topic isn't available." onRetry={refetch} />
        </View>
      ) : (
        <ScrollView className="px-6" contentContainerStyle={{ paddingBottom: 40 }}>
          <Text className="text-gray-400 text-xs mb-1">
            {data.grid.name} · {data.section.name}
          </Text>
          <Text className="text-[20px] font-bold text-gray-900 mb-1">{data.topic.title}</Text>
          {data.topic.short_description ? (
            <Text className="text-gray-500 text-sm mb-4">{data.topic.short_description}</Text>
          ) : null}

          {data.locked ? (
            <View className="border border-amber-200 bg-amber-50 rounded-2xl p-5 items-center mt-3">
              <Ionicons name="lock-closed" size={28} color="#B45309" />
              <Text className="text-amber-900 font-semibold mt-2 mb-1">Premium topic</Text>
              <Text className="text-amber-800 text-sm text-center mb-4">
                Upgrade to CampusEduX Premium to read this topic.
              </Text>
              <Button
                label="See Premium Plans"
                onPress={() => navigation.getParent()?.navigate("Premium", { screen: "PremiumPlans" })}
                className="w-full"
              />
            </View>
          ) : data.contents.length === 0 ? (
            <Text className="text-gray-500 text-sm mt-2">This topic has no content yet — check back soon.</Text>
          ) : (
            data.contents.map((block) => (
              <View key={block.id} className="mb-4">
                {block.heading ? (
                  <Text className="text-[17px] font-bold text-gray-900 mt-3 mb-1">{block.heading}</Text>
                ) : null}
                {block.content_format === "plain" ? (
                  <Text className="text-[15px] leading-6 text-gray-800">{block.body}</Text>
                ) : (
                  <MarkdownText source={block.body} enableRunOnWeb />
                )}
                {block.file_url ? (
                  <Button
                    label="Open attachment"
                    variant="outline"
                    leftIcon="download-outline"
                    className="mt-3"
                    onPress={() => openUrl(block.file_url as string)}
                  />
                ) : null}
                {block.video_url ? (
                  <Button
                    label="Watch video"
                    variant="outline"
                    leftIcon="play-circle-outline"
                    className="mt-2"
                    onPress={() => openUrl(block.video_url as string)}
                  />
                ) : null}
              </View>
            ))
          )}

          {practice && (practice.mock_tests.length > 0 || practice.coding_problems.length > 0) ? (
            <View className="mt-8 pt-6 border-t border-gray-100">
              {practice.mock_tests.length > 0 ? (
                <View className="mb-2">
                  <Text className="text-[15px] font-bold text-gray-900 mb-2">
                    📝 Mock Test{practice.mock_tests.length > 1 ? "s" : ""}
                  </Text>
                  {practice.mock_tests.map((t: TopicMockTestCard) => (
                    <Pressable
                      key={t.id}
                      onPress={() =>
                        t.is_premium && !isPremiumUser
                          ? navigation.getParent()?.navigate("Premium", { screen: "PremiumPlans" })
                          : navigation.navigate("TestInstruction", { testId: t.id })
                      }
                      className="border border-gray-200 rounded-2xl p-4 mb-3"
                    >
                      <View className="flex-row items-start justify-between">
                        <Text className="text-gray-900 font-semibold flex-1 mr-2">{t.title}</Text>
                        {t.is_premium ? <Ionicons name="lock-closed" size={14} color="#B45309" /> : null}
                      </View>
                      <Text className="text-gray-400 text-xs mt-1">
                        {t.question_count} question{t.question_count === 1 ? "" : "s"}
                        {t.duration_minutes ? ` · ${t.duration_minutes} min` : ""}
                        {t.difficulty ? ` · ${t.difficulty}` : ""}
                      </Text>
                      <Text className="text-primary text-xs font-semibold mt-2">Start Mock Test ›</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {practice.coding_problems.length > 0 ? (
                <View className={practice.mock_tests.length > 0 ? "mt-4" : ""}>
                  <Text className="text-[15px] font-bold text-gray-900 mb-2">
                    💻 Coding Problem{practice.coding_problems.length > 1 ? "s" : ""}
                  </Text>
                  {practice.coding_problems.map((p: TopicCodingProblemCard) => (
                    <Pressable
                      key={p.id}
                      onPress={() =>
                        navigation.navigate("LearningCodingProblem", { slug: p.slug, title: p.title })
                      }
                      className="border border-gray-200 rounded-2xl p-4 mb-3"
                    >
                      <View className="flex-row items-start justify-between">
                        <Text className="text-gray-900 font-semibold flex-1 mr-2">{p.title}</Text>
                        {p.is_premium ? <Ionicons name="lock-closed" size={14} color="#B45309" /> : null}
                      </View>
                      <Text className="text-gray-400 text-xs mt-1">
                        {p.difficulty}
                        {p.supported_languages?.length ? ` · ${p.supported_languages.join(", ")}` : ""}
                      </Text>
                      <Text className="text-primary text-xs font-semibold mt-2">View Problem ›</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          <View className="flex-row justify-between mt-6" style={{ gap: 10 }}>
            {data.prev ? (
              <Pressable
                onPress={() =>
                  navigation.replace("LearningTopic", {
                    gridSlug: params.gridSlug,
                    topicSlug: data.prev!.slug,
                    topicTitle: data.prev!.title,
                  })
                }
                className="flex-1 border border-gray-200 rounded-xl p-3"
              >
                <Text className="text-gray-400 text-xs">‹ Previous</Text>
                <Text className="text-gray-900 text-sm font-semibold mt-0.5" numberOfLines={1}>
                  {data.prev.title}
                </Text>
              </Pressable>
            ) : (
              <View className="flex-1" />
            )}
            {data.next ? (
              <Pressable
                onPress={() =>
                  navigation.replace("LearningTopic", {
                    gridSlug: params.gridSlug,
                    topicSlug: data.next!.slug,
                    topicTitle: data.next!.title,
                  })
                }
                className="flex-1 border border-gray-200 rounded-xl p-3"
              >
                <Text className="text-gray-400 text-xs text-right">Next ›</Text>
                <Text className="text-gray-900 text-sm font-semibold mt-0.5 text-right" numberOfLines={1}>
                  {data.next.title}
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

export default LearningTopicScreen;
