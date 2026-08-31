import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, CircularProgress, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { usePerformanceAnalysis } from "@/hooks/usePlacement";

export function PerformanceAnalysisScreen() {
  const navigation = useNavigation();
  const { data, isLoading, isError, refetch } = usePerformanceAnalysis();

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Performance Analysis</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Analyzing your performance..." />
      ) : isError || !data ? (
        <ErrorState message="Couldn't load your performance data." onRetry={refetch} />
      ) : data.testsTaken === 0 ? (
        <EmptyState icon="stats-chart-outline" title="No tests taken yet" subtitle="Take a practice test to see your performance analysis." />
      ) : (
        <>
          <View className="items-center mb-6">
            <CircularProgress percent={data.overallAccuracyPercent} size={130} sublabel="Overall" />
          </View>

          <View className="flex-row justify-between mb-6" style={{ gap: 10 }}>
            <StatCard label="Tests Taken" value={`${data.testsTaken}`} />
            <StatCard label="Avg Score" value={`${data.averageScorePercent}%`} />
            <StatCard label="Questions" value={`${data.questionsAttempted}`} />
          </View>

          {data.trend.length > 0 && (
            <>
              <Text className="font-bold text-gray-900 mb-3">Performance Trend</Text>
              <View className="flex-row items-end justify-between border border-gray-100 rounded-2xl p-4 mb-6" style={{ height: 140 }}>
                {data.trend.map((point) => (
                  <View key={point.label} className="items-center flex-1">
                    <View
                      className="w-4 rounded-full bg-primary"
                      style={{ height: Math.max(6, (point.scorePercent / 100) * 90) }}
                    />
                    <Text className="text-gray-400 text-[10px] mt-2">{point.label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {data.sectionScores.length > 0 && (
            <>
              <Text className="font-bold text-gray-900 mb-3">Section Wise Performance</Text>
              {data.sectionScores.map((section) => (
                <View key={section.section} className="mb-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-gray-700 text-sm">{section.section}</Text>
                    <Text className="text-gray-400 text-xs">{section.scorePercent}%</Text>
                  </View>
                  <View className="h-1.5 bg-gray-100 rounded-full">
                    <View className="h-1.5 bg-primary rounded-full" style={{ width: `${section.scorePercent}%` }} />
                  </View>
                </View>
              ))}
            </>
          )}
        </>
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

export default PerformanceAnalysisScreen;
