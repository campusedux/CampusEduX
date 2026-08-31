import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { useDSAProblemDetail } from "@/hooks/usePlacement";
import type { PlacementStackParamList, Difficulty } from "@/types";

type Rte = RouteProp<PlacementStackParamList, "ProblemDetails">;

const DIFFICULTY_COLOR: Record<Difficulty, string> = { Easy: "#16A34A", Medium: "#F59E0B", Hard: "#DC2626" };

export function ProblemDetailsScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: problem, isLoading, isError, refetch } = useDSAProblemDetail(params.problemId);

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Loading problem..." /></Screen>;
  if (isError || !problem) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load this problem." onRetry={refetch} /></Screen>;

  return (
    <Screen>
      <ScrollView className="px-6">
        <View className="flex-row items-center justify-between mt-2 mb-4">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          {problem.isSolved && <Ionicons name="checkmark-circle" size={22} color="#16A34A" />}
        </View>

        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-gray-900 flex-1 mr-3">{problem.title}</Text>
          <Text className="font-semibold text-sm" style={{ color: DIFFICULTY_COLOR[problem.difficulty] }}>{problem.difficulty}</Text>
        </View>

        <Text className="text-gray-600 leading-5 mb-5">{problem.description}</Text>

        {problem.examples.map((example, index) => (
          <View key={index} className="bg-gray-50 rounded-2xl p-4 mb-3">
            <Text className="font-semibold text-gray-900 text-sm mb-2">Example {index + 1}:</Text>
            <Text className="text-gray-600 text-sm">Input: {example.input}</Text>
            <Text className="text-gray-600 text-sm">Output: {example.output}</Text>
            {example.explanation && <Text className="text-gray-400 text-xs mt-1">Explanation: {example.explanation}</Text>}
          </View>
        ))}

        {problem.constraints.length > 0 && (
          <>
            <Text className="font-semibold text-gray-900 mt-3 mb-2">Constraints:</Text>
            {problem.constraints.map((c) => (
              <Text key={c} className="text-gray-500 text-sm mb-1">• {c}</Text>
            ))}
          </>
        )}
        <View className="h-6" />
      </ScrollView>

      <View className="px-6 py-4 border-t border-gray-100">
        <Button label="Solve Problem" onPress={() => (navigation as any).navigate("CodeEditor", { problemId: problem.id })} />
      </View>
    </Screen>
  );
}

export default ProblemDetailsScreen;
