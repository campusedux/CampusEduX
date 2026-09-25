import React from "react";
import { View, Text } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui";
import { ErrorBlock } from "@/components/learning/LearningStates";
import { TestButton, TestHeader, TestLoading } from "@/components/learning/test/TestKit";
import { useTheme } from "@/theme";
import { useTestDetail } from "@/hooks/usePlacement";
import type { PlacementStackParamList } from "@/types";

type Rte = RouteProp<PlacementStackParamList, "TestInstruction">;

export function TestInstructionScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: test, isLoading, isError, refetch } = useTestDetail(params.testId);
  const { colors, type } = useTheme();

  if (isLoading) return <Screen themed className="items-center justify-center"><TestLoading label="Loading test..." /></Screen>;
  if (isError || !test) return <Screen themed className="items-center justify-center px-6"><ErrorBlock what="this test" onRetry={refetch} /></Screen>;

  const instructions = [
    `Total Questions: ${test.questionCount}`,
    `Total Time: ${test.durationMinutes} Minutes`,
    "Each question carries 1 mark.",
    "No negative marking.",
    "You can review & change answers before submission.",
    "Timer will start once you click 'Start Test'.",
  ];

  return (
    <Screen themed className="px-6">
      <TestHeader title={test.title} onBack={() => navigation.goBack()} style={{ marginBottom: 24 }} />

      <View className="items-center mb-6">
        <View className="w-20 h-20 rounded-full items-center justify-center" style={{ backgroundColor: colors.primarySoft }}>
          <Ionicons name="clipboard-outline" size={36} color={colors.primary} />
        </View>
      </View>

      <Text accessibilityRole="header" style={[type.title, { color: colors.text, marginBottom: 12 }]}>Test Instructions</Text>
      {instructions.map((line, index) => (
        <View key={line} className="flex-row items-start mb-3">
          <Text style={[type.label, { color: colors.primaryText, marginRight: 8 }]}>{index + 1}.</Text>
          <Text style={[type.small, { color: colors.textSecondary, flex: 1, fontSize: 15, lineHeight: 22 }]}>{line}</Text>
        </View>
      ))}

      <View className="flex-1" />
      <TestButton label="Start Test" onPress={() => (navigation as any).navigate("LiveTest", { testId: test.id })} style={{ marginBottom: 24 }} />
    </Screen>
  );
}

export default TestInstructionScreen;
