import React from "react";
import { View, Text, Pressable, Share } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState } from "@/components/ui";
import { useReferralOverview } from "@/hooks/useReferral";
import { describeRewardRule } from "@/services/referral.service";

const SHARE_CHANNELS = [
  { key: "whatsapp", label: "WhatsApp", icon: "logo-whatsapp" as const, color: "#25D366" },
  { key: "telegram", label: "Telegram", icon: "paper-plane-outline" as const, color: "#229ED9" },
  { key: "instagram", label: "Instagram", icon: "logo-instagram" as const, color: "#E1306C" },
  { key: "twitter", label: "Twitter", icon: "logo-twitter" as const, color: "#1DA1F2" },
  { key: "more", label: "More", icon: "ellipsis-horizontal" as const, color: "#6B7280" },
];

export function ShareReferralScreen() {
  const navigation = useNavigation();
  const { data, isLoading, isError, refetch } = useReferralOverview();

  // With a known reward rule (admin reward_settings) the message explains it;
  // when the rule is unknown (null) the message carries NO amount at all —
  // a default number must never go out in a share.
  const message = data
    ? `Join me on CampusEduX using my code ${data.code}: ${data.shareLink}` +
      (data.rewardRule ? `\n\n(${describeRewardRule(data.rewardRule)})` : "")
    : "";

  const shareTo = async () => {
    // The native share sheet is used for every channel (WhatsApp, Telegram,
    // etc.) rather than per-app deep links, since those require the app to
    // be installed and platform-specific URL schemes that vary by OS.
    try {
      await Share.share({ message });
    } catch {
      // user dismissed the share sheet
    }
  };

  const copyLink = async () => {
    if (!data) return;
    await Clipboard.setStringAsync(data.shareLink);
    notify("Copied", "Referral link copied to clipboard.");
  };

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-6">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Share & Earn</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading your referral link..." />
      ) : isError || !data ? (
        <ErrorState message="Couldn't load referral details." onRetry={refetch} />
      ) : (
        <>
          <View className="items-center mb-8">
            <View className="w-24 h-24 rounded-full items-center justify-center mb-4" style={{ backgroundColor: "#EEF0FF" }}>
              <Ionicons name="megaphone-outline" size={44} color="#4F39F6" />
            </View>
            <Text className="text-lg font-bold text-gray-900 text-center">Share your referral link with friends</Text>
            <Text className="text-gray-500 text-sm text-center mt-1">and earn exciting rewards</Text>
          </View>

          <Text className="text-gray-500 text-sm mb-2">Referral Link</Text>
          <View className="flex-row items-center mb-6" style={{ gap: 10 }}>
            <View className="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
              <Text className="text-gray-700 text-xs" numberOfLines={1}>{data.shareLink}</Text>
            </View>
            <Pressable onPress={copyLink} className="px-4 py-3 rounded-xl border border-gray-200">
              <Text className="text-primary font-semibold">Copy</Text>
            </Pressable>
          </View>

          <Text className="text-gray-500 text-sm mb-3">Share via</Text>
          <View className="flex-row flex-wrap mb-8" style={{ gap: 16 }}>
            {SHARE_CHANNELS.map((channel) => (
              <Pressable key={channel.key} onPress={shareTo} className="items-center" style={{ width: "28%" }}>
                <View className="w-14 h-14 rounded-2xl items-center justify-center mb-1.5" style={{ backgroundColor: `${channel.color}1A` }}>
                  <Ionicons name={channel.icon} size={26} color={channel.color} />
                </View>
                <Text className="text-gray-600 text-xs">{channel.label}</Text>
              </Pressable>
            ))}
          </View>

          <View className="border border-gray-100 rounded-2xl p-4">
            <Text className="font-semibold text-gray-900 mb-1">Earn More Rewards</Text>
            <Text className="text-gray-500 text-sm">The more you refer, the more you earn!</Text>
          </View>
        </>
      )}
    </Screen>
  );
}

export default ShareReferralScreen;
