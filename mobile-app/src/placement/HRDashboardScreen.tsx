import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, CircularProgress, LoadingState, ErrorState } from "@/components/ui";
import { useHRQuestions, useFavoriteQuestions } from "@/hooks/usePlacement";
import type { PlacementStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<PlacementStackParamList, "HRDashboard">;

const CATEGORIES = ["General Questions", "Behavioral Questions", "Situational Questions", "Career Questions"];

export function HRDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { data: questions, isLoading, isError, refetch } = useHRQuestions();
  const { data: favorites } = useFavoriteQuestions();

  const practiced = (questions ?? []).length;
  const pct = practiced > 0 ? Math.round(((favorites?.length ?? 0) / practiced) * 100) : 0;

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">HR Interview</Text>
      </View>

      <View className="items-center border border-gray-100 rounded-2xl py-6 mb-6">
        <CircularProgress percent={pct} size={110} />
        <Text className="font-bold text-gray-900 mt-3">Prepare for HR Round</Text>
        <Text className="text-gray-400 text-sm text-center px-6 mt-1">Answer with confidence.</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading questions..." />
      ) : isError ? (
        <ErrorState message="Couldn't load HR questions." onRetry={refetch} />
      ) : (
        <View className="flex-row justify-between mb-6" style={{ gap: 10 }}>
          <StatCard label="Questions" value={`${practiced}`} />
          <StatCard label="Favorites" value={`${favorites?.length ?? 0}`} />
        </View>
      )}

      <Text className="font-bold text-gray-900 mb-3">Categories</Text>
      {CATEGORIES.map((cat) => (
        <Pressable
          key={cat}
          onPress={() => (navigation as any).navigate("HRQuestion", { category: cat })}
          className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 mb-3"
        >
          <Text className="font-semibold text-gray-900">{cat}</Text>
          <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        </Pressable>
      ))}

      <Pressable
        onPress={() => (navigation as any).navigate("FavoriteQuestion")}
        className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 mb-6"
      >
        <View className="flex-row items-center">
          <Ionicons name="star" size={18} color="#F59E0B" style={{ marginRight: 10 }} />
          <Text className="font-semibold text-gray-900">Favorite Questions</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
      </Pressable>
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

export default HRDashboardScreen;
