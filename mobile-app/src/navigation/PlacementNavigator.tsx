import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PlacementHomeScreen } from "@/placement/PlacementHomeScreen";
import { NotesListScreen } from "@/placement/NotesListScreen";
import { NoteDetailScreen } from "@/placement/NoteDetailScreen";
import { AptitudeDashboardScreen } from "@/placement/AptitudeDashboardScreen";
import { QuantitativeScreen } from "@/placement/QuantitativeScreen";
import { LogicalReasoningScreen } from "@/placement/LogicalReasoningScreen";
import { VerbalAbilityScreen } from "@/placement/VerbalAbilityScreen";
import { PracticeTestListScreen } from "@/placement/PracticeTestListScreen";
import { TestInstructionScreen } from "@/placement/TestInstructionScreen";
import { LiveTestScreen } from "@/placement/LiveTestScreen";
import { TestResultScreen } from "@/placement/TestResultScreen";
import { PerformanceAnalysisScreen } from "@/placement/PerformanceAnalysisScreen";
import { DSADashboardScreen } from "@/placement/DSADashboardScreen";
import { TopicListScreen } from "@/placement/TopicListScreen";
import { ProblemDetailsScreen } from "@/placement/ProblemDetailsScreen";
import { CodeEditorScreen } from "@/placement/CodeEditorScreen";
import { SolutionExplanationScreen } from "@/placement/SolutionExplanationScreen";
import { HRDashboardScreen } from "@/placement/HRDashboardScreen";
import { HRQuestionScreen } from "@/placement/HRQuestionScreen";
import { FavoriteQuestionScreen } from "@/placement/FavoriteQuestionScreen";
import { CompanyListScreen } from "@/placement/CompanyListScreen";
import { CompanyDashboardScreen } from "@/placement/CompanyDashboardScreen";
import { CompanyQuestionScreen } from "@/placement/CompanyQuestionScreen";
import { CompanyMockTestScreen } from "@/placement/CompanyMockTestScreen";
import { CompanyResultScreen } from "@/placement/CompanyResultScreen";
import { CompanyAnalyticsScreen } from "@/placement/CompanyAnalyticsScreen";
import type { PlacementStackParamList } from "@/types";

const Stack = createNativeStackNavigator<PlacementStackParamList>();

/**
 * Module 5 - Placement Preparation (24 screens): Aptitude, DSA, HR
 * Interview, and Company-Specific prep, nested inside the "Prep" bottom tab.
 */
export function PlacementNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PlacementHome" component={PlacementHomeScreen} />
      <Stack.Screen name="Notes" component={NotesListScreen} />
      <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
      <Stack.Screen name="AptitudeDashboard" component={AptitudeDashboardScreen} />
      <Stack.Screen name="Quantitative" component={QuantitativeScreen} />
      <Stack.Screen name="LogicalReasoning" component={LogicalReasoningScreen} />
      <Stack.Screen name="VerbalAbility" component={VerbalAbilityScreen} />
      <Stack.Screen name="PracticeTestList" component={PracticeTestListScreen} />
      <Stack.Screen name="TestInstruction" component={TestInstructionScreen} />
      <Stack.Screen name="LiveTest" component={LiveTestScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="TestResult" component={TestResultScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="PerformanceAnalysis" component={PerformanceAnalysisScreen} />
      <Stack.Screen name="DSADashboard" component={DSADashboardScreen} />
      <Stack.Screen name="TopicList" component={TopicListScreen} />
      <Stack.Screen name="ProblemDetails" component={ProblemDetailsScreen} />
      <Stack.Screen name="CodeEditor" component={CodeEditorScreen} />
      <Stack.Screen name="SolutionExplanation" component={SolutionExplanationScreen} />
      <Stack.Screen name="HRDashboard" component={HRDashboardScreen} />
      <Stack.Screen name="HRQuestion" component={HRQuestionScreen} />
      <Stack.Screen name="FavoriteQuestion" component={FavoriteQuestionScreen} />
      <Stack.Screen name="CompanyList" component={CompanyListScreen} />
      <Stack.Screen name="CompanyDashboard" component={CompanyDashboardScreen} />
      <Stack.Screen name="CompanyQuestion" component={CompanyQuestionScreen} />
      <Stack.Screen name="CompanyMockTest" component={CompanyMockTestScreen} />
      <Stack.Screen name="CompanyResult" component={CompanyResultScreen} />
      <Stack.Screen name="CompanyAnalytic" component={CompanyAnalyticsScreen} />
    </Stack.Navigator>
  );
}

export default PlacementNavigator;
