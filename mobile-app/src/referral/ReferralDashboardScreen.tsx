import React from "react";
import { View, Text, Pressable } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { useReferralOverview } from "@/hooks/useReferral";
import { describeRewardRule } from "@/services/referral.service";
import type { ReferralRewardRule, ReferralStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<ReferralStackParamList, "ReferralDashboard">;

function rewardPhrase(rule: ReferralRewardRule): string {
  return rule.bonusType === "flat"
    ? `₹${rule.bonusValue}`
    : `${rule.bonusValue}% of their first order`;
}

function howItWorks(rule: ReferralRewardRule) {
  return [
    { step: 1, text: "Share your referral code or link with your friends" },
    { step: 2, text: "Your friend signs up using your link or code" },
    {
      step: 3,
      text: rule.rewardOnSignup
        ? `You instantly earn ${rewardPhrase(rule)} — no purchase needed`
        : `When your friend makes their first purchase, you earn ${rewardPhrase(rule)}`,
    },
    { step: 4, text: "The reward is credited to your wallet balance" },
  ];
}

export function ReferralDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useReferralOverview();

  const copyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    notify("Copied", "Referral code copied to clipboard.");
  };

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-5">
        <Text className="text-xl font-bold text-gray-900">Referral Dashboard</Text>
        <Ionicons name="notifications-outline" size={22} color="#111827" />
      </View>

      {isLoading ? (
        <LoadingState label="Loading your referral summary..." />
      ) : isError || !data ? (
        <ErrorState message="Couldn't load referral details." onRetry={refetch} />
      ) : (
        <>
          <View className="rounded-2xl p-5 mb-4" style={{ backgroundColor: "#4F39F6" }}>
            <Text className="text-white font-bold text-lg mb-1">Refer & Earn</Text>
            <Text className="text-indigo-100 text-sm">
              {data.rewardRule.bonusType === "flat"
                ? `Earn ₹${data.rewardRule.bonusValue} for every friend who joins and buys`
                : `Earn ${data.rewardRule.bonusValue}% of your friend's first order`}
            </Text>
          </View>

          <View className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 mb-6">
            <Text className="text-[13px] leading-5 text-indigo-900">
              {describeRewardRule(data.rewardRule)}
            </Text>
          </View>

          <Text className="text-gray-500 text-sm mb-2">Your Referral Code</Text>
          <View className="flex-row items-center mb-6" style={{ gap: 10 }}>
            <View className="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
              <Text className="font-bold text-gray-900 tracking-wider">{data.code}</Text>
            </View>
            <Pressable onPress={() => copyCode(data.code)} className="px-4 py-3 rounded-xl border border-gray-200">
              <Text className="text-primary font-semibold">Copy</Text>
            </Pressable>
          </View>

          <View className="flex-row flex-wrap mb-2" style={{ rowGap: 12, columnGap: 12 }}>
            <Stat value={data.totalReferrals} label="Total Referrals" />
            <Stat value={data.successfulReferrals} label="Successful" />
            <Stat value={data.pendingReferrals} label="Pending" />
            <Stat value={`₹${data.totalEarned}`} label="Total Earned" />
            <Stat value={`₹${data.pendingRewards}`} label="Pending Rewards" />
            {data.cancelledReferrals > 0 ? (
              <Stat value={data.cancelledReferrals} label="Cancelled" />
            ) : null}
          </View>

          <Text className="font-bold text-gray-900 mb-3 mt-4">How It Works?</Text>
          {howItWorks(data.rewardRule).map((item) => (
            <View key={item.step} className="flex-row items-start mb-3">
              <View className="w-6 h-6 rounded-full bg-primary items-center justify-center mr-3 mt-0.5">
                <Text className="text-white text-xs font-bold">{item.step}</Text>
              </View>
              <Text className="text-gray-600 text-sm flex-1">{item.text}</Text>
            </View>
          ))}

          <Button label="Share Referral" onPress={() => (navigation as any).navigate("ShareReferral")} className="mt-3 mb-6" />

          <View className="flex-row flex-wrap justify-between mb-6" style={{ rowGap: 10 }}>
            <QuickLink icon="cash-outline" label="Earnings" onPress={() => (navigation as any).navigate("Earnings")} />
            <QuickLink icon="wallet-outline" label="Wallet" onPress={() => (navigation as any).navigate("Wallet")} />
            <QuickLink icon="time-outline" label="History" onPress={() => (navigation as any).navigate("ReferralHistory")} />
            <QuickLink icon="trophy-outline" label="Leaderboard" onPress={() => (navigation as any).navigate("Leaderboard")} />
          </View>
        </>
      )}
    </Screen>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <View className="border border-gray-100 rounded-2xl p-4 items-center" style={{ width: "31%" }}>
      <Text className="text-xl font-bold text-gray-900">{value}</Text>
      <Text className="text-gray-400 text-[11px] mt-1 text-center">{label}</Text>
    </View>
  );
}

function QuickLink({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="items-center border border-gray-100 rounded-2xl py-4" style={{ width: "48%" }}>
      <Ionicons name={icon} size={22} color="#4F39F6" />
      <Text className="text-gray-700 text-sm font-medium mt-2">{label}</Text>
    </Pressable>
  );
}

export default ReferralDashboardScreen;
