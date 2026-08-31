import React from "react";
import { View, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, DrawerMenuButton, PressableScale } from "@/components/ui";
import { usePlacementDashboard } from "@/hooks/usePlacement";
import { useAuthStore } from "@/store/authStore";
import { CARD_SHADOW } from "@/constants/theme";
import type { PlacementStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<PlacementStackParamList, "PlacementHome">;

const SECTIONS = [
  { label: "Learning Material", icon: "document-text-outline", route: "Notes" as const },
  { label: "Aptitude", icon: "calculator-outline", route: "AptitudeDashboard" as const },
  { label: "DSA / Coding", icon: "code-slash-outline", route: "DSADashboard" as const },
  { label: "Mock Tests", icon: "timer-outline", route: "PracticeTestList" as const },
  { label: "HR Interview", icon: "people-outline", route: "HRDashboard" as const },
  { label: "Company Specific", icon: "business-outline", route: "CompanyList" as const },
];

export function PlacementHomeScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = usePlacementDashboard();

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-5">
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <DrawerMenuButton />
          <View>
            <Text className="text-xl font-bold text-gray-900">Learn</Text>
            <Text className="text-gray-500 text-sm mt-0.5">
              Hi {user?.fullName?.split(" ")[0] || "there"}, let&apos;s keep going!
            </Text>
          </View>
        </View>
        <Ionicons name="school-outline" size={26} color="#111827" />
      </View>

      <View className="rounded-2xl p-5 mb-6" style={{ backgroundColor: "#4F39F6" }}>
        <Text className="text-white font-bold text-base mb-1">Stay Consistent</Text>
        <Text className="text-indigo-100 text-sm">Keep Practicing! You&apos;ll make it!</Text>
      </View>

      <Text className="font-bold text-gray-900 mb-3">Your Progress</Text>
      {isLoading ? (
        <LoadingState label="Loading progress..." />
      ) : isError || !data ? (
        <ErrorState message="Couldn't load your progress." onRetry={refetch} />
      ) : (
        <View className="flex-row justify-between mb-6" style={{ gap: 10 }}>
          <StatCard label="Progress" value={`${data.overallProgressPercent}%`} />
          <StatCard label="Tests Taken" value={`${data.testsTaken}`} />
          <StatCard label="Questions" value={`${data.questionsSolved}`} />
          <StatCard label="Accuracy" value={`${data.accuracyPercent}%`} />
        </View>
      )}

      <Text className="font-bold text-gray-900 mb-3">Explore Sections</Text>
      <View className="flex-row flex-wrap justify-between">
        {SECTIONS.map((section) => (
          <PressableScale
            key={section.label}
            onPress={() => (navigation as any).navigate(section.route)}
            className="bg-white border border-gray-100 rounded-2xl p-4 mb-3 items-center"
            style={{ width: "48%", ...CARD_SHADOW }}
          >
            <View className="w-12 h-12 rounded-2xl items-center justify-center mb-2" style={{ backgroundColor: "#EEF0FF" }}>
              <Ionicons name={section.icon as any} size={24} color="#4F39F6" />
            </View>
            <Text className="font-semibold text-gray-900 text-sm text-center">{section.label}</Text>
          </PressableScale>
        ))}
      </View>

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

export default PlacementHomeScreen;
