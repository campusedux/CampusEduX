import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, CircularProgress, LoadingState, ErrorState } from "@/components/ui";
import { usePlacementDashboard, usePracticeTests } from "@/hooks/usePlacement";
import type { PlacementStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<PlacementStackParamList, "AptitudeDashboard">;

const SECTIONS = [
  { label: "Quantitative Aptitude", route: "Quantitative" as const, icon: "calculator-outline" },
  { label: "Logical Reasoning", route: "LogicalReasoning" as const, icon: "bulb-outline" },
  { label: "Verbal Ability", route: "VerbalAbility" as const, icon: "chatbubbles-outline" },
  { label: "Practice Tests", route: "PracticeTestList" as const, icon: "document-text-outline" },
];

export function AptitudeDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = usePlacementDashboard();
  const { data: tests } = usePracticeTests({ category: "aptitude" });

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Aptitude</Text>
      </View>

      <View className="items-center border border-gray-100 rounded-2xl py-6 mb-6">
        <CircularProgress percent={data?.overallProgressPercent ?? 0} size={110} />
        <Text className="font-bold text-gray-900 mt-3">Master Aptitude</Text>
        <Text className="text-gray-400 text-sm text-center px-6 mt-1">Crack any exam with strong fundamentals.</Text>
      </View>

      <Text className="font-bold text-gray-900 mb-3">Your Progress</Text>
      {isLoading ? (
        <LoadingState label="Loading..." />
      ) : isError ? (
        <ErrorState message="Couldn't load progress." onRetry={refetch} />
      ) : (
        <View className="flex-row justify-between mb-6" style={{ gap: 10 }}>
          <StatCard label="Tests Taken" value={`${data?.testsTaken ?? 0}`} />
          <StatCard label="Questions" value={`${data?.questionsSolved ?? 0}`} />
          <StatCard label="Accuracy" value={`${data?.accuracyPercent ?? 0}%`} />
        </View>
      )}

      <Text className="font-bold text-gray-900 mb-3">Sections</Text>
      <View className="mb-4">
        {SECTIONS.map((section) => (
          <Pressable
            key={section.label}
            onPress={() => (navigation as any).navigate(section.route as any)}
            className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 mb-3"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
                <Ionicons name={section.icon as any} size={18} color="#4F39F6" />
              </View>
              <Text className="font-semibold text-gray-900">{section.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </Pressable>
        ))}
      </View>

      {tests && tests.length > 0 && <Text className="text-gray-400 text-xs mb-6">{tests.length} practice tests available</Text>}
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

export default AptitudeDashboardScreen;
