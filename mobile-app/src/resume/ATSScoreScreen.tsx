import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp, CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, CircularProgress, LoadingState, ErrorState } from "@/components/ui";
import { useATSBreakdown } from "@/hooks/useResume";
import type { ResumeStackParamList } from "@/types";

type Rte = RouteProp<ResumeStackParamList, "ATSScore">;

function scoreLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  return "Needs Work";
}

export function ATSScoreScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: breakdown, isLoading, isError, refetch } = useATSBreakdown(params.resumeId);

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Analyzing your resume..." /></Screen>;
  if (isError || !breakdown) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't analyze your resume." onRetry={refetch} /></Screen>;

  return (
    <Screen className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-6">
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">ATS Score</Text>
        </View>
      </View>

      <View className="items-center mb-6">
        <CircularProgress percent={breakdown.overall} size={140} sublabel={scoreLabel(breakdown.overall)} />
        <Text className="text-gray-900 font-semibold mt-3">Your resume is ATS-friendly</Text>
      </View>

      <ScoreBar label="Content" value={breakdown.content} />
      <ScoreBar label="Formatting" value={breakdown.formatting} />
      <ScoreBar label="Skills" value={breakdown.skills} />
      <ScoreBar label="Keywords" value={breakdown.keywords} />

      <View className="bg-green-50 rounded-2xl p-4 mt-4 mb-6">
        {breakdown.tips.map((tip, index) => (
          <View key={tip.ruleId ?? `tip-${index}`} className="flex-row items-start mb-2.5">
            <Ionicons
              name={tip.ruleId === null ? "star" : "alert-circle"}
              size={14}
              color={tip.ruleId === null ? "#16A34A" : "#D97706"}
              style={{ marginTop: 2 }}
            />
            <View className="ml-2 flex-1">
              <Text className="text-green-800 text-sm font-medium">{tip.problem}</Text>
              {!!tip.why && <Text className="text-green-700 text-xs mt-0.5">{tip.why}</Text>}
            </View>
          </View>
        ))}
      </View>

      <Button
        label="Download Resume"
        className="mb-3"
        onPress={() => (navigation as any).navigate("DownloadPDF", { resumeId: params.resumeId })}
      />
      <Button
        label="Back to Dashboard"
        variant="text"
        onPress={() => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "ResumeDashboard" }] }))}
      />
    </Screen>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className="text-gray-700 text-sm">{label}</Text>
        <Text className="text-gray-400 text-xs">{value}%</Text>
      </View>
      <View className="h-2 bg-gray-100 rounded-full">
        <View className="h-2 bg-primary rounded-full" style={{ width: `${value}%` }} />
      </View>
    </View>
  );
}

export default ATSScoreScreen;
