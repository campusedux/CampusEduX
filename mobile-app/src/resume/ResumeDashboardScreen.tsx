import React from "react";
import { View, Text, Pressable } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useResumeList } from "@/hooks/useResume";
import type { ResumeStackParamList, ResumeSummary } from "@/types";

type Nav = NativeStackNavigationProp<ResumeStackParamList, "ResumeDashboard">;

function buildTools(nav: Nav, resumes: ResumeSummary[] | undefined) {
  const latest = resumes?.[0];
  return [
    { label: "Templates", icon: "grid-outline", onPress: () => nav.navigate("Templates", undefined) },
    {
      label: "ATS Score",
      icon: "speedometer-outline",
      onPress: () =>
        latest
          ? nav.navigate("ATSScore", { resumeId: latest.id })
          : notify("ATS Score", "Create a resume first, then check its ATS score here."),
    },
    { label: "Resume Tips", icon: "bulb-outline", onPress: () => nav.navigate("ResumeTips") },
    { label: "History", icon: "time-outline", onPress: () => nav.navigate("ResumeHistory") },
  ];
}

export function ResumeDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useResumeList();
  const tools = buildTools(navigation, data);

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-5">
        <Pressable onPress={() => (navigation.getParent() as any)?.navigate("MainTabs")} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900 flex-1">Resume Builder</Text>
        <Ionicons name="notifications-outline" size={22} color="#111827" />
      </View>

      <View className="rounded-2xl p-5 mb-6" style={{ backgroundColor: "#4F39F6" }}>
        <Text className="text-white font-bold text-base mb-1">Create Your Professional Resume</Text>
        <Text className="text-indigo-100 text-sm mb-4">Build a job-winning resume in minutes with our easy editor.</Text>
        <Pressable
          onPress={() => (navigation as any).navigate("Templates", undefined)}
          className="self-start bg-white rounded-lg px-4 py-2"
        >
          <Text className="text-primary font-semibold text-sm">Create New Resume</Text>
        </Pressable>
      </View>

      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-bold text-gray-900">Your Resumes</Text>
        <Pressable onPress={() => (navigation as any).navigate("ResumeHistory")}>
          <Text className="text-primary text-sm font-medium">See All</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingState label="Loading your resumes..." />
      ) : isError ? (
        <ErrorState message="Couldn't load your resumes." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="document-text-outline" title="No resumes yet" subtitle="Create your first resume to get started." />
      ) : (
        data.slice(0, 4).map((resume) => (
          <Pressable
            key={resume.id}
            onPress={() => (navigation as any).navigate("ResumeEditor", { resumeId: resume.id })}
            className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 mb-3"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
                <Ionicons name="document-text-outline" size={18} color="#4F39F6" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900" numberOfLines={1}>{resume.title}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">Updated {new Date(resume.updatedAt).toLocaleDateString()}</Text>
              </View>
            </View>
            <View className="bg-green-50 rounded-full px-2.5 py-1">
              <Text className="text-green-700 text-xs font-semibold">ATS {resume.atsScore}%</Text>
            </View>
          </Pressable>
        ))
      )}

      <Text className="font-bold text-gray-900 mb-3 mt-3">Resume Tools</Text>
      <View className="flex-row flex-wrap justify-between mb-6">
        {tools.map((tool) => (
          <Pressable
            key={tool.label}
            onPress={tool.onPress}
            className="items-center border border-gray-100 rounded-2xl py-4 mb-3"
            style={{ width: "48%" }}
          >
            <Ionicons name={tool.icon as any} size={22} color="#4F39F6" />
            <Text className="text-gray-700 text-sm font-medium mt-2 text-center">{tool.label}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

export default ResumeDashboardScreen;
