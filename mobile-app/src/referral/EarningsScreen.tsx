import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useEarningsSummary } from "@/hooks/useReferral";
import type { ReferralStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<ReferralStackParamList, "Earnings">;

export function EarningsScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useEarningsSummary();

  const maxMonthAmount = Math.max(1, ...(data?.monthlyTrend.map((m) => m.amount) ?? [1]));

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Earnings</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading earnings..." />
      ) : isError || !data ? (
        <ErrorState message="Couldn't load earnings." onRetry={refetch} />
      ) : (
        <>
          <View className="rounded-2xl p-5 mb-6" style={{ backgroundColor: "#4F39F6" }}>
            <Text className="text-indigo-100 text-sm mb-1">Total Earnings</Text>
            <Text className="text-white text-3xl font-bold mb-3">₹{data.totalEarnings.toLocaleString()}</Text>
            <View className="flex-row justify-between border-t border-white/20 pt-3">
              <View>
                <Text className="text-white font-bold">{data.totalReferrals}</Text>
                <Text className="text-indigo-100 text-xs mt-0.5">Total Referrals</Text>
              </View>
              <View>
                <Text className="text-white font-bold">₹{data.pendingEarnings.toLocaleString()}</Text>
                <Text className="text-indigo-100 text-xs mt-0.5">Pending Earnings</Text>
              </View>
            </View>
          </View>

          <Text className="font-bold text-gray-900 mb-3">Earning Overview</Text>
          <View className="border border-gray-100 rounded-2xl p-4 mb-6">
            <SummaryRow icon="checkmark-circle-outline" label="Successful Referrals" value={`${data.successfulReferrals}`} color="#16A34A" />
            <SummaryRow icon="time-outline" label="Pending Referrals" value={`${data.pendingReferrals}`} color="#F59E0B" />
            <SummaryRow icon="close-circle-outline" label="Cancelled Referrals" value={`${data.cancelledReferrals}`} color="#DC2626" last />
          </View>

          <Text className="font-bold text-gray-900 mb-3">Earnings Summary</Text>
          <View className="flex-row items-end justify-between border border-gray-100 rounded-2xl p-4 mb-6" style={{ height: 150 }}>
            {data.monthlyTrend.map((point) => (
              <View key={point.month} className="items-center flex-1">
                <Text className="text-gray-400 text-[10px] mb-1">₹{point.amount}</Text>
                <View
                  className="w-4 rounded-full bg-primary"
                  style={{ height: Math.max(6, (point.amount / maxMonthAmount) * 80) }}
                />
                <Text className="text-gray-400 text-[10px] mt-2">{point.month}</Text>
              </View>
            ))}
          </View>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-bold text-gray-900">Recent Earnings</Text>
            <Pressable onPress={() => (navigation as any).navigate("ReferralHistory")}>
              <Text className="text-primary text-sm font-medium">View All</Text>
            </Pressable>
          </View>
          {data.recentEarnings.length === 0 ? (
            <EmptyState icon="cash-outline" title="No earnings yet" subtitle="Refer friends to start earning rewards." />
          ) : (
            data.recentEarnings.map((entry) => (
              <View key={entry.id} className="flex-row items-center justify-between border-b border-gray-100 py-3">
                <View className="flex-row items-center flex-1">
                  <View className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
                    <Ionicons name="person-outline" size={16} color="#4F39F6" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900 text-sm" numberOfLines={1}>{entry.referredUserName}</Text>
                    <Text className="text-gray-400 text-xs mt-0.5">{new Date(entry.createdAt).toLocaleDateString()}</Text>
                  </View>
                </View>
                <Text className="text-green-600 font-semibold">+₹{entry.rewardAmount}</Text>
              </View>
            ))
          )}
          <View className="h-6" />
        </>
      )}
    </Screen>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  color,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
  last?: boolean;
}) {
  return (
    <View className={`flex-row items-center justify-between ${last ? "" : "mb-3"}`}>
      <View className="flex-row items-center">
        <Ionicons name={icon} size={16} color={color} />
        <Text className="text-gray-500 text-sm ml-2">{label}</Text>
      </View>
      <Text className="text-gray-900 font-medium text-sm">{value}</Text>
    </View>
  );
}

export default EarningsScreen;
