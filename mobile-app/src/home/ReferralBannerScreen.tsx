import React from "react";
import { View, Text, Pressable, Share } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { Screen, ScreenHeader, Card, Button, SkeletonList, ErrorState } from "@/components/ui";
import { notify } from "@/lib/notify";
import { useReferralSummary } from "@/hooks/useHomeData";
import { referralAmountText } from "@/lib/referralAmount";
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
      <ScreenHeader title="Invite & Earn" onBack={() => navigation.goBack()} />

      {isLoading ? (
        <SkeletonList count={2} hero />
      ) : isError || !data ? (
        <ErrorState message="Couldn't load referral details." onRetry={refetch} />
      ) : (
        <>
          <View style={{ marginBottom: 24 }}>
            <Card variant="gradient" accent="indigo" padding={20}>
              <View className="flex-row items-center">
                <View className="flex-1 pr-3">
                  <Text className="text-white font-bold text-xl mb-1">Refer Friends &amp; Earn</Text>
                  <Text className="text-white/90 text-sm">Share your code and invite friends</Text>
                </View>
                <View className="w-16 h-16 rounded-2xl items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                  <Ionicons name="gift" size={34} color="#FBBF24" />
                </View>
              </View>
            </Card>
          </View>

          <Text className="text-gray-600 text-sm font-medium mb-2">Your Referral Code</Text>
          <View className="flex-row items-center mb-5" style={{ gap: 10 }}>
            <View className="flex-1 justify-center border border-dashed border-primary-300 rounded-xl px-4 bg-primary-50" style={{ minHeight: 48 }}>
              <Text className="font-bold text-gray-900 tracking-wider">{data.code || "—"}</Text>
            </View>
            <Button label="Copy" size="sm" leftIcon="copy-outline" onPress={() => copyCode(data.code)} disabled={!data.code} />
          </View>

          <Text className="text-gray-600 text-sm font-medium mb-2">Share your link</Text>
          <View className="flex-row items-center mb-8" style={{ gap: 10 }}>
            <View className="flex-1 justify-center border border-gray-200 rounded-xl px-4 bg-gray-50" style={{ minHeight: 48 }}>
              <Text className="text-gray-700 text-xs" numberOfLines={1}>
                {data.shareLink || "Referral link will appear here"}
              </Text>
            </View>
            <Pressable
              onPress={() => shareReferral(data.shareLink)}
              disabled={!data.shareLink}
              accessibilityRole="button"
              accessibilityLabel="Share referral link"
              className={`rounded-xl items-center justify-center bg-primary ${data.shareLink ? "" : "opacity-60"}`}
              style={{ width: 48, height: 48 }}
            >
              <Ionicons name="share-social-outline" size={20} color="#fff" />
            </Pressable>
          </View>

          {referralAmountText(data) ? (
            <>
              <Text className="font-bold text-gray-900 text-lg mb-3">Refer &amp; Earn Benefits</Text>
              <Card variant="tinted" accent="emerald">
                <Text className="font-bold text-xl" style={{ color: "#047857" }}>{referralAmountText(data)}</Text>
                <Text className="text-gray-900 font-semibold text-sm mt-1">You Get</Text>
                <Text className="text-gray-600 text-xs mt-0.5">Per successful referral</Text>
              </Card>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

export default ReferralBannerScreen;
