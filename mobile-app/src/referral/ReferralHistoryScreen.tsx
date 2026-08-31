import React, { useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useReferralHistory } from "@/hooks/useReferral";
import type { ReferralStatus } from "@/types";

type Filter = "all" | ReferralStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "successful", label: "Successful" },
  { key: "pending", label: "Pending" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_STYLES: Record<ReferralStatus, { label: string; bg: string; text: string }> = {
  successful: { label: "Success", bg: "#DCFCE7", text: "#166534" },
  pending: { label: "Pending", bg: "#FEF3C7", text: "#92400E" },
  cancelled: { label: "Cancelled", bg: "#FEE2E2", text: "#991B1B" },
};

export function ReferralHistoryScreen() {
  const navigation = useNavigation();
  const [filter, setFilter] = useState<Filter>("all");
  const { data, isLoading, isError, refetch } = useReferralHistory(filter);

  return (
    <Screen className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">Referral History</Text>
        </View>
        <Ionicons name="filter-outline" size={20} color="#111827" />
      </View>

      <View className="flex-row mb-4" style={{ gap: 8 }}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            className="px-4 py-2 rounded-full border"
            style={{ backgroundColor: filter === f.key ? "#4F39F6" : "#fff", borderColor: filter === f.key ? "#4F39F6" : "#E5E7EB" }}
          >
            <Text className={filter === f.key ? "text-white font-medium" : "text-gray-600"}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <LoadingState label="Loading referral history..." />
      ) : isError ? (
        <ErrorState message="Couldn't load referral history." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="people-outline" title="No referrals yet" subtitle="Share your code to start earning rewards." />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const style = STATUS_STYLES[item.status];
            return (
              <View className="flex-row items-center border border-gray-100 rounded-2xl p-4 mb-3">
                <View className="w-11 h-11 rounded-full items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
                  <Ionicons name="person-outline" size={20} color="#4F39F6" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900" numberOfLines={1}>{item.referredUserName}</Text>
                  <Text className="text-gray-400 text-xs mt-0.5">{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <View className="items-end">
                  <Text className={`font-semibold ${item.status === "successful" ? "text-green-600" : "text-gray-400"}`}>
                    {item.status === "successful" ? "+" : ""}₹{item.rewardAmount.toFixed(2)}
                  </Text>
                  <View className="rounded-full px-2.5 py-0.5 mt-1" style={{ backgroundColor: style.bg }}>
                    <Text className="text-[11px] font-semibold" style={{ color: style.text }}>{style.label}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}

export default ReferralHistoryScreen;
