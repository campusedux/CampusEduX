import { boundaryScreenLayout } from "@/components/errors/ErrorBoundary";
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ReferralDashboardScreen } from "@/referral/ReferralDashboardScreen";
import { ShareReferralScreen } from "@/referral/ShareReferralScreen";
import { EarningsScreen } from "@/referral/EarningsScreen";
import { WalletScreen } from "@/referral/WalletScreen";
import { ReferralHistoryScreen } from "@/referral/ReferralHistoryScreen";
import { LeaderboardScreen } from "@/referral/LeaderboardScreen";
import type { ReferralStackParamList } from "@/types";

const Stack = createNativeStackNavigator<ReferralStackParamList>();

/**
 * Module 9 - Referral (6 screens), reached from the drawer. The full
 * dedicated experience — Home's "Invite & Earn" banner (Module 2) and
 * Profile's "Referral & Earn" row (Module 8) are lighter-weight summaries
 * of the same underlying referral_codes data and now deep-link here for
 * the full dashboard/history/leaderboard.
 */
export function ReferralNavigator() {
  return (
    <Stack.Navigator screenLayout={boundaryScreenLayout} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReferralDashboard" component={ReferralDashboardScreen} />
      <Stack.Screen name="ShareReferral" component={ShareReferralScreen} />
      <Stack.Screen name="Earnings" component={EarningsScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="ReferralHistory" component={ReferralHistoryScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
    </Stack.Navigator>
  );
}

export default ReferralNavigator;
