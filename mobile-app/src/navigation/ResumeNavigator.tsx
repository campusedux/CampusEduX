import { boundaryScreenLayout } from "@/components/errors/ErrorBoundary";
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ResumeDashboardScreen } from "@/resume/ResumeDashboardScreen";
import { ResumeTipsScreen } from "@/resume/ResumeTipsScreen";
import { TemplatesScreen } from "@/resume/TemplatesScreen";
import { ResumeEditorScreen } from "@/resume/ResumeEditorScreen";
import { SectionEditScreen } from "@/resume/SectionEditScreen";
import { PersonalDetailsScreen } from "@/resume/PersonalDetailsScreen";
import { EducationScreen } from "@/resume/EducationScreen";
import { SkillsScreen } from "@/resume/SkillsScreen";
import { PreviewResumeScreen } from "@/resume/PreviewResumeScreen";
import { ATSScoreScreen } from "@/resume/ATSScoreScreen";
import { JdMatchScreen } from "@/resume/JdMatchScreen";
import { DownloadPDFScreen } from "@/resume/DownloadPDFScreen";
import { ResumeUploadImportScreen } from "@/resume/ResumeUploadImportScreen";
import { ResumeHistoryScreen } from "@/resume/ResumeHistoryScreen";
import type { ResumeStackParamList } from "@/types";

const Stack = createNativeStackNavigator<ResumeStackParamList>();

/**
 * Module 6 - Resume Builder (10 screens), reached from the drawer.
 * Two entry flows share these screens: the linear "new resume" wizard
 * (Templates -> Personal -> Education -> Skills -> Preview -> ATS -> PDF)
 * and revisiting an existing resume from the Editor hub or History.
 */
export function ResumeNavigator() {
  return (
    <Stack.Navigator screenLayout={boundaryScreenLayout} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ResumeDashboard" component={ResumeDashboardScreen} />
      <Stack.Screen name="ResumeTips" component={ResumeTipsScreen} />
      <Stack.Screen name="Templates" component={TemplatesScreen} />
      <Stack.Screen name="ResumeEditor" component={ResumeEditorScreen} />
      <Stack.Screen name="SectionEdit" component={SectionEditScreen} />
      <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
      <Stack.Screen name="Education" component={EducationScreen} />
      <Stack.Screen name="Skills" component={SkillsScreen} />
      <Stack.Screen name="PreviewResume" component={PreviewResumeScreen} />
      <Stack.Screen name="ATSScore" component={ATSScoreScreen} />
      <Stack.Screen name="JdMatch" component={JdMatchScreen} />
      <Stack.Screen name="DownloadPDF" component={DownloadPDFScreen} />
      <Stack.Screen name="ResumeUploadImport" component={ResumeUploadImportScreen} />
      <Stack.Screen name="ResumeHistory" component={ResumeHistoryScreen} />
    </Stack.Navigator>
  );
}

export default ResumeNavigator;
