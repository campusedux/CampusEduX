import React from "react";
import { View, Text } from "react-native";
import { useNavigation, useRoute, RouteProp, CommonActions } from "@react-navigation/native";
import { Screen, CircularProgress } from "@/components/ui";
import { ErrorBlock } from "@/components/learning/LearningStates";
import { TestButton, TestHeader, TestLoading, TestStatCard } from "@/components/learning/test/TestKit";
import { useTheme } from "@/theme";
import { useTestResult } from "@/hooks/usePlacement";
import type { PlacementStackParamList } from "@/types";

type Rte = RouteProp<PlacementStackParamList, "TestResult">;

export function TestResultScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: result, isLoading, isError, refetch } = useTestResult(params.attemptId);
  const { colors, type } = useTheme();

  if (isLoading) return <Screen themed className="items-center justify-center"><TestLoading label="Calculating your result..." /></Screen>;
  if (isError || !result) return <Screen themed className="items-center justify-center px-6"><ErrorBlock what="your result" onRetry={refetch} /></Screen>;

  return (
    <Screen themed className="px-6 items-center">
      <TestHeader title="Test Result" onBack={() => navigation.goBack()} style={{ alignSelf: "stretch", marginBottom: 16 }} />

      <View className="items-center mb-4">
        <Text accessibilityRole="header" style={[type.h3, { color: colors.text, marginBottom: 4 }]}>Great Job! 🎉</Text>
        <Text style={[type.small, { color: colors.textSecondary }]}>You have completed the test</Text>
      </View>

      <CircularProgress
        percent={result.accuracyPercent}
        size={140}
        label={`${result.score}/${result.totalMarks}`}
        sublabel="Score"
        color={colors.primary}
        trackColor={colors.border}
        labelColor={colors.text}
        sublabelColor={colors.textSecondary}
      />

      <View className="flex-row justify-between w-full mt-8 mb-6" style={{ gap: 10 }}>
        <TestStatCard label="Accuracy" value={`${result.accuracyPercent}%`} />
        <TestStatCard label="Correct" value={`${result.correctCount}`} />
        <TestStatCard label="Incorrect" value={`${result.incorrectCount}`} />
      </View>

      <TestButton
        label="View Analysis"
        style={{ alignSelf: "stretch", marginBottom: 12 }}
        onPress={() => (navigation as any).navigate("PerformanceAnalysis", { attemptId: result.attemptId })}
      />
      <TestButton
        label="Back to Tests"
        variant="text"
        onPress={() => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "PlacementHome" }] }))}
      />
    </Screen>
  );
}

export default TestResultScreen;
