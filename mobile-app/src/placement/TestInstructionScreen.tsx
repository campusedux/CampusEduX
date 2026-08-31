import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { useTestDetail } from "@/hooks/usePlacement";
import type { PlacementStackParamList } from "@/types";

type Rte = RouteProp<PlacementStackParamList, "TestInstruction">;

export function TestInstructionScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: test, isLoading, isError, refetch } = useTestDetail(params.testId);

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Loading test..." /></Screen>;
  if (isError || !test) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load this test." onRetry={refetch} /></Screen>;

  const instructions = [
    `Total Questions: ${test.questionCount}`,
    `Total Time: ${test.durationMinutes} Minutes`,
    "Each question carries 1 mark.",
    "No negative marking.",
    "You can review & change answers before submission.",
    "Timer will start once you click 'Start Test'.",
  ];

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-6">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>{test.title}</Text>
      </View>

      <View className="items-center mb-6">
        <View className="w-20 h-20 rounded-full items-center justify-center" style={{ backgroundColor: "#EEF0FF" }}>
          <Ionicons name="clipboard-outline" size={36} color="#4F39F6" />
        </View>
      </View>

      <Text className="font-bold text-gray-900 mb-3">Test Instructions</Text>
      {instructions.map((line, index) => (
        <View key={line} className="flex-row items-start mb-3">
          <Text className="text-primary font-semibold mr-2">{index + 1}.</Text>
          <Text className="text-gray-600 flex-1">{line}</Text>
        </View>
      ))}

      <View className="flex-1" />
      <Button label="Start Test" onPress={() => (navigation as any).navigate("LiveTest", { testId: test.id })} className="mb-6" />
    </Screen>
  );
}

export default TestInstructionScreen;
