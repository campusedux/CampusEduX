import React from "react";
import { View, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Screen, CircularProgress } from "@/components/ui";
import { EmptyBlock, ErrorBlock } from "@/components/learning/LearningStates";
import { TestHeader, TestLoading, TestStatCard } from "@/components/learning/test/TestKit";
import { useTheme } from "@/theme";
import { usePerformanceAnalysis } from "@/hooks/usePlacement";

export function PerformanceAnalysisScreen() {
  const navigation = useNavigation();
  const { data, isLoading, isError, refetch } = usePerformanceAnalysis();
  const { colors, type } = useTheme();

  return (
    <Screen themed scroll className="px-6">
      <TestHeader title="Performance Analysis" onBack={() => navigation.goBack()} style={{ marginBottom: 20 }} />

      {isLoading ? (
        <View style={{ height: 240 }}>
          <TestLoading label="Analyzing your performance..." />
        </View>
      ) : isError || !data ? (
        <ErrorBlock what="your performance data" onRetry={refetch} />
      ) : data.testsTaken === 0 ? (
        <EmptyBlock emoji="📊" title="No tests taken yet" message="Take a practice test to see your performance analysis." />
      ) : (
        <>
          <View className="items-center mb-6">
            <CircularProgress percent={data.overallAccuracyPercent} size={130} sublabel="Overall" color={colors.primary} trackColor={colors.border} labelColor={colors.text} sublabelColor={colors.textSecondary} />
          </View>

          <View className="flex-row justify-between mb-6" style={{ gap: 10 }}>
            <TestStatCard label="Tests Taken" value={`${data.testsTaken}`} />
            <TestStatCard label="Avg Score" value={`${data.averageScorePercent}%`} />
            <TestStatCard label="Questions" value={`${data.questionsAttempted}`} />
          </View>

          {data.trend.length > 0 && (
            <>
              <Text accessibilityRole="header" style={[type.title, { color: colors.text, marginBottom: 12 }]}>Performance Trend</Text>
              <View className="flex-row items-end justify-between rounded-2xl p-4 mb-6" style={{ height: 140, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
                {data.trend.map((point) => (
                  <View key={point.label} className="items-center flex-1">
                    <View
                      className="w-4 rounded-full"
                      style={{ height: Math.max(6, (point.scorePercent / 100) * 90), backgroundColor: colors.primary }}
                    />
                    <Text style={[type.caption, { color: colors.textSecondary, marginTop: 8, fontSize: 10 }]}>{point.label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {data.sectionScores.length > 0 && (
            <>
              <Text accessibilityRole="header" style={[type.title, { color: colors.text, marginBottom: 12 }]}>Section Wise Performance</Text>
              {data.sectionScores.map((section) => (
                <View key={section.section} className="mb-3">
                  <View className="flex-row justify-between mb-1">
                    <Text style={[type.small, { color: colors.text }]}>{section.section}</Text>
                    <Text style={[type.caption, { color: colors.textSecondary }]}>{section.scorePercent}%</Text>
                  </View>
                  <View className="h-1.5 rounded-full" style={{ backgroundColor: colors.border }}>
                    <View className="h-1.5 rounded-full" style={{ width: `${section.scorePercent}%`, backgroundColor: colors.primary }} />
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

export default PerformanceAnalysisScreen;
