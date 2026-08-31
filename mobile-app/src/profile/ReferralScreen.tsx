import React from "react";
import { View, Text, Pressable, Share } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState } from "@/components/ui";
import { useReferralSummary } from "@/hooks/useHomeData";

/**
 * Same referral data as Home's "Invite & Earn" screen (Module 2) — a
 * student has exactly one referral code, so this reuses useReferralSummary
 * rather than a second backend concept. Full Referral module (dashboard,
 * leaderboard, earnings breakdown) ships as Module 9.
 */
export function ReferralScreen() {
  const navigation = useNavigation();
  const { data, isLoading, isError, refetch } = useReferralSummary();

  const copyCode = async (value: string) => {
    await Clipboard.setStringAsync(value);
    notify("Copied", "Referral link copied to clipboard.");
  };

  const shareReferral = async (link: string) => {
    try {
      await Share.share({ message: `Join me on CampusEduX! Use my referral link: ${link}` });
    } catch {
      // user dismissed the share sheet
    }
  };

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Referral & Earn</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading your referral details..." />
      ) : isError || !data ? (
        <ErrorState message="Couldn't load referral details." onRetry={refetch} />
      ) : (
        <>
          <View className="rounded-2xl p-5 mb-5" style={{ backgroundColor: "#4F39F6" }}>
            <Text className="text-white font-bold text-lg mb-1">Invite Friends & Earn Rewards</Text>
            <Text className="text-indigo-100 text-sm">Refer your friends and earn exciting rewards.</Text>
          </View>

          <Text className="text-gray-500 text-sm mb-2">Your Referral Code</Text>
          <View className="flex-row items-center mb-5" style={{ gap: 10 }}>
            <View className="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
              <Text className="font-bold text-gray-900 tracking-wider">{data.code || "—"}</Text>
            </View>
            <Pressable onPress={() => copyCode(data.code)} disabled={!data.code} className="px-4 py-3 rounded-xl border border-gray-200">
              <Text className="text-primary font-semibold">Copy</Text>
            </Pressable>
          </View>

          <Text className="text-gray-500 text-sm mb-2">Share Your Link</Text>
          <View className="flex-row items-center mb-6" style={{ gap: 10 }}>
            <View className="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
              <Text className="text-gray-700 text-xs" numberOfLines={1}>
                {data.shareLink || "Referral link will appear here"}
              </Text>
            </View>
            <Pressable onPress={() => shareReferral(data.shareLink)} disabled={!data.shareLink} className="px-4 py-3 rounded-xl bg-primary">
              <Ionicons name="share-social-outline" size={18} color="#fff" />
            </Pressable>
          </View>

          <View className="flex-row mb-6" style={{ gap: 12 }}>
            <View className="flex-1 border border-gray-100 rounded-2xl p-4 items-center">
              <Text className="text-2xl font-bold text-gray-900">{data.totalReferrals}</Text>
              <Text className="text-gray-400 text-xs mt-1">Total Referrals</Text>
            </View>
            <View className="flex-1 border border-gray-100 rounded-2xl p-4 items-center">
              <Text className="text-2xl font-bold text-gray-900">₹{data.totalEarned}</Text>
              <Text className="text-gray-400 text-xs mt-1">Total Earned</Text>
            </View>
          </View>

          <Text className="font-bold text-gray-900 mb-3">How You Earn?</Text>
          <View className="mb-3 flex-row items-start">
            <View className="w-6 h-6 rounded-full bg-primary items-center justify-center mr-3 mt-0.5">
              <Text className="text-white text-xs font-bold">1</Text>
            </View>
            <Text className="text-gray-600 text-sm flex-1">Friend signs up using your link — you get ₹{data.referrerBonus}</Text>
          </View>
          <View className="mb-6 flex-row items-start">
            <View className="w-6 h-6 rounded-full bg-primary items-center justify-center mr-3 mt-0.5">
              <Text className="text-white text-xs font-bold">2</Text>
            </View>
            <Text className="text-gray-600 text-sm flex-1">Friend makes a purchase — you get up to {data.refereeDiscountPercent}% of the amount</Text>
          </View>

          <Pressable
            onPress={() => (navigation.getParent() as any)?.navigate("Referral", { screen: "ReferralDashboard" })}
            className="flex-row items-center justify-center border border-gray-200 rounded-xl py-3.5 mb-6"
          >
            <Text className="text-primary font-semibold mr-1.5">View Full Referral Dashboard</Text>
            <Ionicons name="arrow-forward" size={16} color="#4F39F6" />
          </Pressable>
        </>
      )}
    </Screen>
  );
}

export default ReferralScreen;
