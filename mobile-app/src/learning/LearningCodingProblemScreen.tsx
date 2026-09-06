import React from "react";
import { View, Text, Pressable, ScrollView, Linking } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { MarkdownText } from "@/components/learning/MarkdownText";
import { notify } from "@/lib/notify";
import { useCodingProblem } from "@/hooks/useLearning";
import { codingProblemUrl } from "@/lib/compilerLink";
import type { PlacementStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<PlacementStackParamList, "LearningCodingProblem">;
type Rte = RouteProp<PlacementStackParamList, "LearningCodingProblem">;

const DIFF_COLOR: Record<string, string> = { Easy: "#16A34A", Medium: "#F59E0B", Hard: "#DC2626" };

/**
 * Read-only Coding Problem detail. The mobile app never bundles a compiler /
 * editor / run engine (master prompt §4, §29) — code execution happens on the
 * CampusEduX website, reached via the "Solve on Website" button.
 */
export function LearningCodingProblemScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { data, isLoading, isError, refetch } = useCodingProblem(params.slug);

  const openWebsite = () =>
    Linking.openURL(codingProblemUrl(params.slug)).catch(() => notify("Couldn't open the website"));

  return (
    <Screen className="px-0">
      <View className="flex-row items-center px-6 mt-2 mb-2">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-base font-semibold text-gray-900 ml-3" numberOfLines={1}>
          {params.title ?? "Coding Problem"}
        </Text>
      </View>

      {isLoading ? (
        <View className="items-center justify-center flex-1">
          <LoadingState label="Loading problem..." />
        </View>
      ) : isError ? (
        <View className="items-center justify-center flex-1 px-6">
          <ErrorState message="Couldn't load this problem." onRetry={refetch} />
        </View>
      ) : !data ? (
        <View className="items-center justify-center flex-1 px-6">
          <ErrorState message="This problem isn't available." onRetry={refetch} />
        </View>
      ) : (
        <ScrollView className="px-6" contentContainerStyle={{ paddingBottom: 40 }}>
          <Text className="text-gray-400 text-xs mb-1">💻 Coding Problem</Text>
          <Text className="text-[20px] font-bold text-gray-900 mb-2">{data.problem.title}</Text>
          <View className="flex-row items-center mb-4" style={{ gap: 10 }}>
            <Text className="font-semibold text-sm" style={{ color: DIFF_COLOR[data.problem.difficulty] ?? "#6B7280" }}>
              {data.problem.difficulty}
            </Text>
            {data.problem.supported_languages?.length ? (
              <Text className="text-gray-500 text-xs">{data.problem.supported_languages.join(" · ")}</Text>
            ) : null}
            {data.problem.is_premium ? (
              <View className="flex-row items-center bg-amber-50 rounded-full px-2 py-0.5">
                <Ionicons name="lock-closed" size={11} color="#B45309" />
                <Text className="text-amber-800 text-[11px] ml-1 font-medium">Premium</Text>
              </View>
            ) : null}
          </View>

          {data.locked ? (
            <View className="border border-amber-200 bg-amber-50 rounded-2xl p-5 items-center mt-1 mb-5">
              <Ionicons name="lock-closed" size={26} color="#B45309" />
              <Text className="text-amber-900 font-semibold mt-2 mb-1">Premium problem</Text>
              <Text className="text-amber-800 text-sm text-center mb-4">
                Upgrade to CampusEduX Premium to read this problem.
              </Text>
              <Button
                label="See Premium Plans"
                onPress={() => navigation.getParent()?.navigate("Premium", { screen: "PremiumPlans" })}
                className="w-full"
              />
            </View>
          ) : (
            <>
              {data.problem.description ? (
                <View className="mb-4">
                  <Text className="font-semibold text-gray-900 text-sm mb-1">Problem Statement</Text>
                  <MarkdownText source={data.problem.description} />
                </View>
              ) : null}

              {data.problem.examples?.length ? (
                <View className="mb-4">
                  <Text className="font-semibold text-gray-900 text-sm mb-2">Examples</Text>
                  {data.problem.examples.map((ex, i) => (
                    <View key={i} className="bg-gray-50 rounded-2xl p-4 mb-3">
                      <Text className="font-semibold text-gray-900 text-sm mb-1">Example {i + 1}</Text>
                      {ex.input !== undefined ? (
                        <Text className="text-gray-600 text-sm">Input: {ex.input || "(none)"}</Text>
                      ) : null}
                      {ex.output !== undefined ? (
                        <Text className="text-gray-600 text-sm">Output: {ex.output}</Text>
                      ) : null}
                      {ex.explanation ? (
                        <Text className="text-gray-400 text-xs mt-1">Explanation: {ex.explanation}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}

              {data.problem.constraints?.length ? (
                <View className="mb-4">
                  <Text className="font-semibold text-gray-900 text-sm mb-2">Constraints</Text>
                  {data.problem.constraints.map((c, i) => (
                    <Text key={i} className="text-gray-500 text-sm mb-1">
                      • {c}
                    </Text>
                  ))}
                </View>
              ) : null}

              {data.problem.hints?.length ? (
                <View className="mb-4">
                  <Text className="font-semibold text-gray-900 text-sm mb-2">Hints</Text>
                  {data.problem.hints.map((h, i) => (
                    <Text key={i} className="text-gray-500 text-sm mb-1">
                      {i + 1}. {h}
                    </Text>
                  ))}
                </View>
              ) : null}

              {data.solution_approach ? (
                <View className="mb-4">
                  <Text className="font-semibold text-gray-900 text-sm mb-1">Explanation</Text>
                  <Text className="text-gray-600 text-sm leading-5">{data.solution_approach}</Text>
                </View>
              ) : null}

              <View className="border border-gray-200 bg-gray-50 rounded-2xl p-4 mt-2">
                <Text className="text-gray-700 text-sm text-center mb-3">
                  Code execution is available on the CampusEduX Website.
                </Text>
                <Button label="Solve on Website" leftIcon="open-outline" onPress={openWebsite} className="w-full" />
              </View>
            </>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

export default LearningCodingProblemScreen;
