import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp, CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { useApplicationDetail } from "@/hooks/useJobs";
import type { JobStackParamList, ApplicationStage } from "@/types";

type Rte = RouteProp<JobStackParamList, "ApplicationStatus">;

const STAGE_ICON: Record<ApplicationStage["status"], keyof typeof Ionicons.glyphMap> = {
  completed: "checkmark-circle",
  in_progress: "time",
  pending: "ellipse-outline",
};
const STAGE_COLOR: Record<ApplicationStage["status"], string> = {
  completed: "#16A34A",
  in_progress: "#4F39F6",
  pending: "#D1D5DB",
};

export function ApplicationStatusScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: application, isLoading, isError, refetch } = useApplicationDetail(params.applicationId);

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Loading application..." /></Screen>;
  if (isError || !application) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load this application." onRetry={refetch} /></Screen>;

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-6">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Application Status</Text>
      </View>

      <View className="items-center mb-6">
        <View className="w-20 h-20 rounded-full items-center justify-center mb-3" style={{ backgroundColor: "#EEF0FF" }}>
          <Ionicons name="clipboard-outline" size={36} color="#4F39F6" />
        </View>
      </View>

      <View className="border border-gray-100 rounded-2xl p-4 mb-6">
        <Text className="font-bold text-gray-900" numberOfLines={1}>{application.job.title}</Text>
        <Text className="text-gray-400 text-sm mt-0.5">{application.job.companyName}</Text>
        <Text className="text-gray-400 text-xs mt-2">Applied on {new Date(application.appliedAt).toLocaleDateString()}</Text>
        <Text className="text-gray-400 text-xs">Application ID: {application.id.toUpperCase()}</Text>
        <Text className="text-gray-400 text-xs">Resume: {application.resumeFileName}</Text>
      </View>

      {application.stages.map((stage, index) => (
        <View key={stage.label} className="flex-row">
          <View className="items-center mr-3" style={{ width: 24 }}>
            <Ionicons name={STAGE_ICON[stage.status]} size={22} color={STAGE_COLOR[stage.status]} />
            {index < application.stages.length - 1 && (
              <View className="w-0.5 flex-1 my-1" style={{ backgroundColor: stage.status === "pending" ? "#E5E7EB" : "#16A34A", minHeight: 24 }} />
            )}
          </View>
          <View className="flex-1 mb-5">
            <Text className={`font-medium ${stage.status === "pending" ? "text-gray-400" : "text-gray-900"}`}>{stage.label}</Text>
            {stage.date && <Text className="text-gray-400 text-xs mt-0.5">{new Date(stage.date).toLocaleDateString()}</Text>}
            {stage.status === "pending" && !stage.date && <Text className="text-gray-400 text-xs mt-0.5">Pending</Text>}
          </View>
        </View>
      ))}

      <Text className="text-gray-400 text-xs text-center mb-6">
        You will be notified at every step of the recruitment process.
      </Text>

      <Button
        label="Back to Home"
        variant="outline"
        onPress={() => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "JobsDashboard" }] }))}
      />
    </Screen>
  );
}

export default ApplicationStatusScreen;
