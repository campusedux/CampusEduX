import React from "react";
import { View, Text, Pressable, Share } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState } from "@/components/ui";
import { notify } from "@/lib/notify";
import { useReferralSummary } from "@/hooks/useHomeData";
import type { HomeStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<HomeStackParamList, "ReferralBanner">;

export function ReferralBannerScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useReferralSummary();

  const copyCode = async (value: string) => {
    await Clipboard.setStringAsync(value);
    notify("Copied", "Referral code copied to clipboard.");
  };

  const shareReferral = async (link: string) => {
    try {
      await Share.share({ message: `Join me on CampusEduX! Use my referral link: ${link}` });
    } catch {
      // user dismissed the share sheet — no action needed
    }
  };

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Invite &amp; Earn</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading your referral details..." />
      ) : isError || !data ? (
        <ErrorState message="Couldn't load referral details." onRetry={refetch} />
      ) : (
        <>
          <View className="flex-row items-center rounded-2xl p-5 mb-6" style={{ backgroundColor: "#4F39F6" }}>
            <View className="flex-1 pr-3">
              <Text className="text-white font-bold text-lg mb-1">Refer Friends &amp; Earn</Text>
              <Text className="text-white/80 text-sm">You both get rewarded!</Text>
            </View>
            <Ionicons name="gift" size={44} color="#FBBF24" />
          </View>

          <Text className="text-gray-500 text-sm mb-2">Your Referral Code</Text>
          <View className="flex-row items-center mb-5" style={{ gap: 10 }}>
            <View className="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
              <Text className="font-bold text-gray-900 tracking-wider">{data.code || "—"}</Text>
            </View>
            <Pressable
              onPress={() => copyCode(data.code)}
              disabled={!data.code}
              className="px-5 py-3 rounded-xl bg-primary"
            >
              <Text className="text-white font-semibold">Copy</Text>
            </Pressable>
          </View>

          <Text className="text-gray-500 text-sm mb-2">Share your link</Text>
          <View className="flex-row items-center mb-8" style={{ gap: 10 }}>
            <View className="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
              <Text className="text-gray-700 text-xs" numberOfLines={1}>
                {data.shareLink || "Referral link will appear here"}
              </Text>
            </View>
            <Pressable
              onPress={() => shareReferral(data.shareLink)}
              disabled={!data.shareLink}
              className="w-11 h-11 rounded-xl items-center justify-center bg-primary"
            >
              <Ionicons name="share-social-outline" size={18} color="#fff" />
            </Pressable>
          </View>

          <Text className="font-bold text-gray-900 mb-3">Refer &amp; Earn Benefits</Text>
          <View className="flex-row" style={{ gap: 12 }}>
            <View className="flex-1 bg-gray-50 rounded-2xl p-4">
              <Text className="text-primary font-bold text-lg">₹{data.referrerBonus}</Text>
              <Text className="text-gray-900 font-semibold text-sm mt-1">You Get</Text>
              <Text className="text-gray-400 text-xs mt-0.5">On successful referral</Text>
            </View>
            <View className="flex-1 bg-gray-50 rounded-2xl p-4">
              <Text className="text-primary font-bold text-lg">{data.refereeDiscountPercent}% OFF</Text>
              <Text className="text-gray-900 font-semibold text-sm mt-1">Friend Gets</Text>
              <Text className="text-gray-400 text-xs mt-0.5">On first purchase</Text>
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

export default ReferralBannerScreen;
