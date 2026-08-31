import React, { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, CircularProgress, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useDSATopics } from "@/hooks/usePlacement";
import type { PlacementStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<PlacementStackParamList, "DSADashboard">;

export function DSADashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useDSATopics();

  const totals = useMemo(() => {
    const totalProblems = (data ?? []).reduce((sum, t) => sum + t.totalProblems, 0);
    const solvedProblems = (data ?? []).reduce((sum, t) => sum + t.solvedProblems, 0);
    return { totalProblems, solvedProblems, pct: totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0 };
  }, [data]);

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">DSA</Text>
      </View>

      <View className="items-center border border-gray-100 rounded-2xl py-6 mb-6">
        <CircularProgress percent={totals.pct} size={110} />
        <Text className="font-bold text-gray-900 mt-3">Practice DSA</Text>
        <Text className="text-gray-400 text-sm text-center px-6 mt-1">Improve your problem-solving skills.</Text>
      </View>

      <View className="flex-row justify-between mb-6" style={{ gap: 10 }}>
        <StatCard label="Problems Solved" value={`${totals.solvedProblems}`} />
        <StatCard label="Total Problems" value={`${totals.totalProblems}`} />
      </View>

      <Text className="font-bold text-gray-900 mb-3">Topics</Text>
      {isLoading ? (
        <LoadingState label="Loading topics..." />
      ) : isError ? (
        <ErrorState message="Couldn't load DSA topics." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No topics yet" />
      ) : (
        data.map((topic) => (
          <Pressable
            key={topic.id}
            onPress={() => (navigation as any).navigate("TopicList", { topicId: topic.id })}
            className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 mb-3"
          >
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">{topic.name}</Text>
              <Text className="text-gray-400 text-xs mt-0.5">{topic.solvedProblems}/{topic.totalProblems} Problems</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </Pressable>
        ))
      )}
      <View className="h-6" />
    </Screen>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center border border-gray-100 rounded-2xl py-3">
      <Text className="font-bold text-gray-900 text-base">{value}</Text>
      <Text className="text-gray-400 text-[10px] mt-0.5 text-center">{label}</Text>
    </View>
  );
}

export default DSADashboardScreen;
