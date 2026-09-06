import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useLearningTree } from "@/hooks/useLearning";
import { CARD_SHADOW } from "@/constants/theme";
import type { LearningSectionNode, PlacementStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<PlacementStackParamList, "LearningGrid">;
type Rte = RouteProp<PlacementStackParamList, "LearningGrid">;

export function LearningGridScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { data, isLoading, isError, refetch } = useLearningTree(params.gridSlug);

  return (
    <Screen className="px-0">
      <View className="flex-row items-center px-6 mt-2 mb-3">
        <Pressable onPress={() => navigation.goBack()} className="mr-3" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900 flex-1" numberOfLines={1}>
          {data?.grid.name ?? params.gridName ?? "Learning"}
        </Text>
      </View>

      {isLoading ? (
        <View className="px-6 pt-10">
          <LoadingState label="Loading..." />
        </View>
      ) : isError ? (
        <View className="px-6 pt-10">
          <ErrorState message="Couldn't load this resource." onRetry={refetch} />
        </View>
      ) : !data ? (
        <View className="px-6 pt-10">
          <EmptyState icon="alert-circle-outline" title="Not available" subtitle="This resource may have been unpublished." />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 4 }}>
          {data.grid.description ? (
            <Text className="text-gray-500 text-sm mb-5 leading-5">{data.grid.description}</Text>
          ) : null}

          {data.sections.length === 0 ? (
            <EmptyState icon="folder-open-outline" title="No sections yet" subtitle="Check back soon." />
          ) : (
            data.sections.map((section, idx) => (
              <SectionBlock
                key={section.id}
                section={section}
                defaultOpen={idx === 0}
                onOpenTopic={(topicSlug, topicTitle) =>
                  navigation.navigate("LearningTopic", { gridSlug: params.gridSlug, topicSlug, topicTitle })
                }
              />
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

function SectionBlock({
  section,
  defaultOpen,
  onOpenTopic,
}: {
  section: LearningSectionNode;
  defaultOpen?: boolean;
  onOpenTopic: (topicSlug: string, topicTitle: string) => void;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <View className="bg-white border border-gray-100 rounded-2xl mb-3 overflow-hidden" style={CARD_SHADOW}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between px-4 py-3.5"
      >
        <View className="flex-1 pr-3">
          <Text className="text-[15px] font-semibold text-gray-900">{section.name}</Text>
          <Text className="text-gray-400 text-xs mt-0.5">
            {section.topics.length} topic{section.topics.length === 1 ? "" : "s"}
          </Text>
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color="#9CA3AF" />
      </Pressable>

      {open ? (
        <View className="border-t border-gray-100">
          {section.topics.length === 0 ? (
            <Text className="text-gray-400 text-sm px-4 py-3">No topics published yet.</Text>
          ) : (
            section.topics.map((topic) => (
              <Pressable
                key={topic.id}
                onPress={() => onOpenTopic(topic.slug, topic.title)}
                className="flex-row items-center px-4 py-3 border-b border-gray-50"
                style={{ gap: 8 }}
              >
                <Ionicons name="document-text-outline" size={16} color="#6B7280" />
                <View className="flex-1">
                  <Text className="text-[14px] text-gray-800">{topic.title}</Text>
                  {topic.short_description ? (
                    <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
                      {topic.short_description}
                    </Text>
                  ) : null}
                </View>
                {topic.is_premium ? <Ionicons name="lock-closed" size={13} color="#B45309" /> : null}
                <Ionicons name="chevron-forward" size={15} color="#D1D5DB" />
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

export default LearningGridScreen;
