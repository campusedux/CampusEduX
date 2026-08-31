import React, { useState } from "react";
import { View, Text, Pressable, Image, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useLeaderboard } from "@/hooks/useReferral";
import type { LeaderboardPeriod, LeaderboardEntry } from "@/types";

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: "this_month", label: "This Month" },
  { key: "this_year", label: "This Year" },
  { key: "all_time", label: "All Time" },
];

const MEDAL_COLORS = ["#FBBF24", "#9CA3AF", "#B45309"];

export function LeaderboardScreen() {
  const navigation = useNavigation();
  const [period, setPeriod] = useState<LeaderboardPeriod>("all_time");
  const { data, isLoading, isError, refetch } = useLeaderboard(period);

  const topThree = data?.slice(0, 3) ?? [];
  const rest = data?.slice(3) ?? [];

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Leaderboard</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading leaderboard..." />
      ) : isError ? (
        <ErrorState message="Couldn't load leaderboard." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="trophy-outline" title="No top referrers yet" subtitle="Be the first to refer a friend!" />
      ) : (
        <>
          <View className="rounded-2xl p-5 mb-5" style={{ backgroundColor: "#4F39F6" }}>
            <View className="flex-row items-center mb-1">
              <Ionicons name="trophy" size={20} color="#FBBF24" />
              <Text className="text-white font-bold text-lg ml-2">Top Referrers</Text>
            </View>
            <Text className="text-indigo-100 text-sm">Congratulations to our top referrers!</Text>
          </View>

          <View className="flex-row mb-5" style={{ gap: 8 }}>
            {PERIODS.map((p) => (
              <Pressable
                key={p.key}
                onPress={() => setPeriod(p.key)}
                className="px-4 py-2 rounded-full border"
                style={{ backgroundColor: period === p.key ? "#4F39F6" : "#fff", borderColor: period === p.key ? "#4F39F6" : "#E5E7EB" }}
              >
                <Text className={period === p.key ? "text-white font-medium" : "text-gray-600"}>{p.label}</Text>
              </Pressable>
            ))}
          </View>

          {topThree.length > 0 && (
            <View className="flex-row items-end justify-center mb-6" style={{ gap: 12 }}>
              {topThree.map((entry) => (
                <PodiumCard key={entry.userId} entry={entry} color={MEDAL_COLORS[entry.rank - 1]} />
              ))}
            </View>
          )}

          <FlatList
            data={rest}
            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => (
              <View
                className="flex-row items-center border border-gray-100 rounded-2xl p-3 mb-3"
                style={item.isCurrentUser ? { borderColor: "#4F39F6", backgroundColor: "#EEF0FF" } : undefined}
              >
                <Text className="font-bold text-gray-400 w-6 text-center">{item.rank}</Text>
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} className="w-10 h-10 rounded-full mx-3" />
                ) : (
                  <View className="w-10 h-10 rounded-full items-center justify-center mx-3" style={{ backgroundColor: "#EEF0FF" }}>
                    <Ionicons name="person-outline" size={18} color="#4F39F6" />
                  </View>
                )}
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900" numberOfLines={1}>
                    {item.userName}
                    {item.isCurrentUser ? " (You)" : ""}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-0.5">{item.totalReferrals} Referrals</Text>
                </View>
                <Text className="font-bold text-gray-900">₹{item.totalEarned.toLocaleString()}</Text>
              </View>
            )}
          />
        </>
      )}
    </Screen>
  );
}

function PodiumCard({ entry, color }: { entry: LeaderboardEntry; color: string }) {
  const isFirst = entry.rank === 1;
  return (
    <View className="items-center" style={{ marginBottom: isFirst ? 0 : 14 }}>
      <View className="relative">
        {entry.avatarUrl ? (
          <Image
            source={{ uri: entry.avatarUrl }}
            style={{ width: isFirst ? 68 : 54, height: isFirst ? 68 : 54, borderRadius: 999, borderWidth: 3, borderColor: color }}
          />
        ) : (
          <View
            className="items-center justify-center"
            style={{ width: isFirst ? 68 : 54, height: isFirst ? 68 : 54, borderRadius: 999, backgroundColor: "#EEF0FF", borderWidth: 3, borderColor: color }}
          >
            <Ionicons name="person" size={isFirst ? 28 : 22} color="#4F39F6" />
          </View>
        )}
        {isFirst && (
          <View className="absolute -top-4 self-center">
            <Ionicons name="trophy" size={20} color={color} />
          </View>
        )}
      </View>
      <Text className="font-semibold text-gray-900 text-xs mt-2 text-center" numberOfLines={1} style={{ maxWidth: 80 }}>
        {entry.userName}
      </Text>
      <Text className="text-gray-400 text-[10px]">{entry.totalReferrals} Referrals</Text>
      <Text className="font-bold text-gray-900 text-xs mt-0.5">₹{entry.totalEarned.toLocaleString()}</Text>
    </View>
  );
}

export default LeaderboardScreen;
