import { boundaryScreenLayout } from "@/components/errors/ErrorBoundary";
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ProfileScreen } from "@/profile/ProfileScreen";
import { EditProfileScreen } from "@/profile/EditProfileScreen";
import { ChangeCourseScreen } from "@/profile/ChangeCourseScreen";
import { ChangeBranchScreen } from "@/profile/ChangeBranchScreen";
import { ChangeYearScreen } from "@/profile/ChangeYearScreen";
import { WalletScreen } from "@/profile/WalletScreen";
import { ReferralScreen } from "@/profile/ReferralScreen";
import { PurchaseHistoryScreen } from "@/profile/PurchaseHistoryScreen";
import { SettingsScreen } from "@/profile/SettingsScreen";
import { HelpSupportScreen } from "@/profile/HelpSupportScreen";
import { AboutScreen } from "@/profile/AboutScreen";
import { LogoutScreen } from "@/profile/LogoutScreen";
import type { ProfileStackParamList } from "@/types";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

/**
 * Module 8 - Profile (12 screens). Nested inside the "Profile" bottom tab,
 * same pattern as Home/Projects/Jobs/Prep.
 */
export function ProfileNavigator() {
  return (
    <Stack.Navigator screenLayout={boundaryScreenLayout} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangeCourse" component={ChangeCourseScreen} />
      <Stack.Screen name="ChangeBranch" component={ChangeBranchScreen} />
      <Stack.Screen name="ChangeYear" component={ChangeYearScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="ReferralEarn" component={ReferralScreen} />
      <Stack.Screen name="PurchaseHistory" component={PurchaseHistoryScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Logout" component={LogoutScreen} />
    </Stack.Navigator>
  );
}

export default ProfileNavigator;
