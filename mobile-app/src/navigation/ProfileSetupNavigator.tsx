import { boundaryScreenLayout } from "@/components/errors/ErrorBoundary";
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SelectCourseScreen } from "@/auth/SelectCourseScreen";
import { SelectBranchScreen } from "@/auth/SelectBranchScreen";
import { SelectYearScreen } from "@/auth/SelectYearScreen";
import { WelcomeScreen } from "@/auth/WelcomeScreen";
import { useAuthStore } from "@/store/authStore";
import type { ProfileSetupStackParamList, UserProfile } from "@/types";

const Stack = createNativeStackNavigator<ProfileSetupStackParamList>();

/**
 * Which step to land on for the student's current academic data. Skips
 * straight to whatever is actually missing — e.g. a student who already has
 * course + year (only branch cleared by ChangeCourseScreen) resumes at
 * SelectBranch instead of being asked for everything again. "Welcome" is
 * never a resume target: it only makes sense right after SelectYear, reached
 * with the `year` route param it requires.
 */
export function resumeProfileSetupStep(
  user: Pick<UserProfile, "course" | "branch" | "year"> | null | undefined
): keyof ProfileSetupStackParamList {
  if (!user?.course) return "SelectCourse";
  if (!user?.branch) return "SelectBranch";
  if (!user?.year) return "SelectYear";
  return "SelectCourse";
}

/**
 * First-time academic setup flow. Mounted by RootNavigator only while a
 * session exists but course / branch / year are not all saved yet. Each step
 * persists its value to Supabase immediately, so a mid-flow restart resumes
 * at whichever field is still missing instead of asking again for what was
 * already answered.
 */
export function ProfileSetupNavigator() {
  const user = useAuthStore((s) => s.user);

  return (
    <Stack.Navigator screenLayout={boundaryScreenLayout}
      screenOptions={{ headerShown: false }}
      initialRouteName={resumeProfileSetupStep(user)}
    >
      <Stack.Screen name="SelectCourse" component={SelectCourseScreen} />
      <Stack.Screen name="SelectBranch" component={SelectBranchScreen} />
      <Stack.Screen name="SelectYear" component={SelectYearScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
    </Stack.Navigator>
  );
}

export default ProfileSetupNavigator;
