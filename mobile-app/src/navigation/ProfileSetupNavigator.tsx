import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SelectCourseScreen } from "@/auth/SelectCourseScreen";
import { SelectBranchScreen } from "@/auth/SelectBranchScreen";
import { SelectYearScreen } from "@/auth/SelectYearScreen";
import { WelcomeScreen } from "@/auth/WelcomeScreen";
import type { ProfileSetupStackParamList } from "@/types";

const Stack = createNativeStackNavigator<ProfileSetupStackParamList>();

/**
 * First-time academic setup flow. Mounted by RootNavigator only while a
 * session exists but course / branch / year are not all saved yet. Each step
 * persists its value to Supabase immediately, so a mid-flow restart resumes
 * without asking again for what was already answered.
 */
export function ProfileSetupNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="SelectCourse"
    >
      <Stack.Screen name="SelectCourse" component={SelectCourseScreen} />
      <Stack.Screen name="SelectBranch" component={SelectBranchScreen} />
      <Stack.Screen name="SelectYear" component={SelectYearScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
    </Stack.Navigator>
  );
}

export default ProfileSetupNavigator;
