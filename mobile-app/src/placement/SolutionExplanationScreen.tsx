import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Chip, LoadingState, ErrorState } from "@/components/ui";
import { useDSAProblemDetail } from "@/hooks/usePlacement";
import type { PlacementStackParamList } from "@/types";

type Rte = RouteProp<PlacementStackParamList, "SolutionExplanation">;
const LANGUAGES = ["python", "javascript", "java", "cpp"] as const;

export function SolutionExplanationScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: problem, isLoading, isError, refetch } = useDSAProblemDetail(params.problemId);
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]>("python");

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Loading solution..." /></Screen>;
  if (isError || !problem) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load the solution." onRetry={refetch} /></Screen>;

  return (
    <Screen>
      <ScrollView className="px-6">
        <View className="flex-row items-center mt-2 mb-4">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>Solution</Text>
        </View>

        <Text className="font-bold text-gray-900 mb-2">Approach</Text>
        <Text className="text-gray-600 leading-5 mb-5">{problem.solutionApproach || "A detailed solution has not been added for this problem yet."}</Text>

        <View className="flex-row mb-3">
          {LANGUAGES.map((lang) => (
            <Chip key={lang} label={lang} active={language === lang} onPress={() => setLanguage(lang)} />
          ))}
        </View>

        <View
          style={{ backgroundColor: "#111827", borderRadius: 12, padding: 14, marginBottom: 20 }}
        >
          <Text style={{ fontFamily: "monospace", fontSize: 12.5, color: "#E5E7EB" }}>
            {problem.solutionCode[language] ?? "Solution not available in this language yet."}
          </Text>
        </View>

        <Text className="font-bold text-gray-900 mb-2">Complexity Analysis</Text>
        <View className="flex-row mb-8" style={{ gap: 10 }}>
          <View className="flex-1 border border-gray-100 rounded-2xl p-3">
            <Text className="text-gray-400 text-xs">Time Complexity</Text>
            <Text className="font-semibold text-gray-900 mt-1">{problem.timeComplexity || "—"}</Text>
          </View>
          <View className="flex-1 border border-gray-100 rounded-2xl p-3">
            <Text className="text-gray-400 text-xs">Space Complexity</Text>
            <Text className="font-semibold text-gray-900 mt-1">{problem.spaceComplexity || "—"}</Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

export default SolutionExplanationScreen;
