import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp, CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, CircularProgress, LoadingState, ErrorState } from "@/components/ui";
import { useTestResult } from "@/hooks/usePlacement";
import type { PlacementStackParamList } from "@/types";

type Rte = RouteProp<PlacementStackParamList, "TestResult">;

export function TestResultScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: result, isLoading, isError, refetch } = useTestResult(params.attemptId);

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Calculating your result..." /></Screen>;
  if (isError || !result) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load your result." onRetry={refetch} /></Screen>;

  return (
    <Screen className="px-6 items-center">
      <View className="flex-row items-center self-stretch mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Test Result</Text>
      </View>

      <View className="items-center mb-4">
        <Text className="text-lg font-bold text-gray-900 mb-1">Great Job! 🎉</Text>
        <Text className="text-gray-400 text-sm">You have completed the test</Text>
      </View>

      <CircularProgress percent={result.accuracyPercent} size={140} label={`${result.score}/${result.totalMarks}`} sublabel="Score" />

      <View className="flex-row justify-between w-full mt-8 mb-6" style={{ gap: 10 }}>
        <StatCard label="Accuracy" value={`${result.accuracyPercent}%`} />
        <StatCard label="Correct" value={`${result.correctCount}`} />
        <StatCard label="Incorrect" value={`${result.incorrectCount}`} />
      </View>

      <Button
        label="View Analysis"
        className="w-full mb-3"
        onPress={() => (navigation as any).navigate("PerformanceAnalysis", { attemptId: result.attemptId })}
      />
      <Button
        label="Back to Tests"
        variant="text"
        onPress={() => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "PlacementHome" }] }))}
      />
    </Screen>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center border border-gray-100 rounded-2xl py-3">
      <Text className="font-bold text-gray-900 text-base">{value}</Text>
      <Text className="text-gray-400 text-[10px] mt-0.5">{label}</Text>
    </View>
  );
}

export default TestResultScreen;
