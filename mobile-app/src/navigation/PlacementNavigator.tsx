import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PlacementHomeScreen } from "@/placement/PlacementHomeScreen";
import { LearningGridsScreen } from "@/learning/LearningGridsScreen";
import { LearningGridScreen } from "@/learning/LearningGridScreen";
import { LearningTopicScreen } from "@/learning/LearningTopicScreen";
import { LearningCodingProblemScreen } from "@/learning/LearningCodingProblemScreen";
import { TestInstructionScreen } from "@/placement/TestInstructionScreen";
import { LiveTestScreen } from "@/placement/LiveTestScreen";
import { TestResultScreen } from "@/placement/TestResultScreen";
import { PerformanceAnalysisScreen } from "@/placement/PerformanceAnalysisScreen";
import type { PlacementStackParamList } from "@/types";

const Stack = createNativeStackNavigator<PlacementStackParamList>();

/**
 * The "Learning" bottom tab (internal route name "Prep", kept for deep-link
 * stability). PlacementHome is the dynamic, DB-driven Learning home; every
 * published grid opens the Grid → Section → Topic → Content tree. The
 * TestInstruction → LiveTest → TestResult chain is the native mock-test flow a
 * Learning topic's Mock Test card opens.
 */
export function PlacementNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PlacementHome" component={PlacementHomeScreen} />
      <Stack.Screen name="LearningGrids" component={LearningGridsScreen} />
      <Stack.Screen name="LearningGrid" component={LearningGridScreen} />
      <Stack.Screen name="LearningTopic" component={LearningTopicScreen} />
      <Stack.Screen name="LearningCodingProblem" component={LearningCodingProblemScreen} />
      <Stack.Screen name="TestInstruction" component={TestInstructionScreen} />
      <Stack.Screen name="LiveTest" component={LiveTestScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="TestResult" component={TestResultScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="PerformanceAnalysis" component={PerformanceAnalysisScreen} />
    </Stack.Navigator>
  );
}

export default PlacementNavigator;
