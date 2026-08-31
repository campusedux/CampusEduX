import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, CircularProgress, LoadingState, ErrorState } from "@/components/ui";
import { usePlacementCompanies, usePracticeTests } from "@/hooks/usePlacement";
import type { PlacementStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<PlacementStackParamList, "CompanyDashboard">;
type Rte = RouteProp<PlacementStackParamList, "CompanyDashboard">;

const SECTIONS = [
  { label: "Company Questions", icon: "help-circle-outline", route: "CompanyQuestion" as const },
  { label: "Mock Tests", icon: "document-text-outline", route: "CompanyMockTest" as const },
  { label: "Previous Results", icon: "bar-chart-outline", route: "CompanyAnalytic" as const },
  { label: "Analytics", icon: "analytics-outline", route: "CompanyAnalytic" as const },
];

export function CompanyDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { data: companies, isLoading, isError, refetch } = usePlacementCompanies();
  const { data: tests } = usePracticeTests({ companyId: params.companyId });
  const company = companies?.find((c) => c.id === params.companyId);

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Loading..." /></Screen>;
  if (isError || !company) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load company." onRetry={refetch} /></Screen>;

  const pct = company.questionsCount > 0 ? Math.round((company.questionsSolved / company.questionsCount) * 100) : 0;

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">{company.name}</Text>
      </View>

      <View className="items-center border border-gray-100 rounded-2xl py-6 mb-6">
        <CircularProgress percent={pct} size={100} />
      </View>

      <View className="flex-row justify-between mb-6" style={{ gap: 10 }}>
        <StatCard label="Questions Solved" value={`${company.questionsSolved}`} />
        <StatCard label="Mock Tests" value={`${tests?.length ?? company.mockTestsCount}`} />
      </View>

      <Text className="font-bold text-gray-900 mb-3">Sections</Text>
      {SECTIONS.map((section) => (
        <Pressable
          key={section.label}
          onPress={() => (navigation as any).navigate(section.route, { companyId: params.companyId })}
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

export default CompanyDashboardScreen;
