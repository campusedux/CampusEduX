import React from "react";
import { View, Text } from "react-native";
import { useNavigation, useRoute, RouteProp, CommonActions } from "@react-navigation/native";
import { Screen, Button, CircularProgress, LoadingState, ErrorState } from "@/components/ui";
import { useTestResult, usePlacementCompanies } from "@/hooks/usePlacement";
import type { PlacementStackParamList } from "@/types";

type Rte = RouteProp<PlacementStackParamList, "CompanyResult">;

export function CompanyResultScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: result, isLoading, isError, refetch } = useTestResult(params.attemptId);
  const { data: companies } = usePlacementCompanies();
  const company = companies?.find((c) => c.id === params.companyId);

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Calculating your result..." /></Screen>;
  if (isError || !result) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load your result." onRetry={refetch} /></Screen>;

  return (
    <Screen className="px-6 items-center">
      <View className="items-center mt-6 mb-1">
        <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={1}>{result.testTitle}</Text>
        <Text className="text-gray-400 text-sm">Completed on {new Date(result.createdAt).toLocaleDateString()}</Text>
      </View>

      <View className="mt-5">
        <CircularProgress percent={result.accuracyPercent} size={140} label={`${result.score}/${result.totalMarks}`} sublabel="Score" />
      </View>

      <View className="flex-row justify-between w-full mt-8 mb-6" style={{ gap: 10 }}>
        <StatCard label="Accuracy" value={`${result.accuracyPercent}%`} />
        <StatCard label="Correct" value={`${result.correctCount}`} />
        <StatCard label="Incorrect" value={`${result.incorrectCount}`} />
      </View>

      {result.sectionScores.length > 0 && (
        <View className="w-full mb-6">
          <Text className="font-bold text-gray-900 mb-3 self-start">Section Wise Score</Text>
          {result.sectionScores.map((section) => (
            <View key={section.section} className="mb-2 flex-row items-center justify-between">
              <Text className="text-gray-600 text-sm">{section.section}</Text>
              <Text className="text-gray-900 font-medium text-sm">{section.scorePercent}%</Text>
            </View>
          ))}
        </View>
      )}

      <Button
        label="View Analysis"
        className="w-full mb-3"
        onPress={() =>
          company
            ? (navigation as any).navigate("CompanyAnalytic", { companyId: company.id })
            : (navigation as any).navigate("PerformanceAnalysis", { attemptId: result.attemptId })
        }
      />
      <Button
        label="Back to Company Dashboard"
        variant="text"
        onPress={() =>
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                company
                  ? { name: "CompanyDashboard", params: { companyId: company.id } }
                  : { name: "PlacementHome" },
              ],
            })
          )
        }
      />
    </Screen>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center border border-gray-100 rounded-2xl py-3">
      <Text className="font-bold text-gray-900 text-base">{value}</Text>
      <Text className="text-gray-400 text-[10px] mt-0.5">{label}</Text>
    </View>
  );
}

export default CompanyResultScreen;
