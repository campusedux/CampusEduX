import React, { useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useFavoriteQuestions, useToggleFavoriteQuestion } from "@/hooks/usePlacement";
import type { HRQuestion } from "@/types";

export function FavoriteQuestionScreen() {
  const navigation = useNavigation();
  const { data, isLoading, isError, refetch } = useFavoriteQuestions();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Favorite Questions</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading favorites..." />
      ) : isError ? (
        <ErrorState message="Couldn't load favorites." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="star-outline" title="No favorite questions yet" subtitle="Tap the star icon on any question to save it here." />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <QuestionCard question={item} expanded={expandedId === item.id} onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)} />
          )}
        />
      )}
    </Screen>
  );
}

function QuestionCard({ question, expanded, onToggle }: { question: HRQuestion; expanded: boolean; onToggle: () => void }) {
  const toggleFavorite = useToggleFavoriteQuestion();
  return (
    <View className="border border-gray-100 rounded-2xl p-4 mb-3">
      <Pressable onPress={onToggle} className="flex-row items-center justify-between">
        <Text className="font-medium text-gray-900 flex-1 mr-3">{question.question}</Text>
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <Pressable onPress={() => toggleFavorite.mutate({ questionId: question.id, isCurrentlyFavorite: true })}>
            <Ionicons name="star" size={18} color="#F59E0B" />
          </Pressable>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color="#9CA3AF" />
        </View>
      </Pressable>
      {expanded && (
        <View className="mt-3 pt-3 border-t border-gray-100">
          {question.answerTips.map((tip) => (
            <Text key={tip} className="text-gray-500 text-sm mb-1">• {tip}</Text>
          ))}
          {question.sampleAnswer ? <Text className="text-gray-600 text-sm leading-5 mt-2">{question.sampleAnswer}</Text> : null}
        </View>
      )}
    </View>
  );
}

export default FavoriteQuestionScreen;
