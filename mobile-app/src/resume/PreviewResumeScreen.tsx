import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { useResumeDetail } from "@/hooks/useResume";
import type { ResumeStackParamList, ResumeTemplate } from "@/types";

type Rte = RouteProp<ResumeStackParamList, "PreviewResume">;

const TEMPLATE_ACCENTS: Record<ResumeTemplate, string> = {
  modern: "#4F39F6",
  professional: "#1E3A8A",
  minimal: "#374151",
  creative: "#DB2777",
};
const TEMPLATE_LABELS: Record<ResumeTemplate, string> = {
  modern: "Modern",
  professional: "Professional",
  minimal: "Minimal",
  creative: "Creative",
};

export function PreviewResumeScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: resume, isLoading, isError, refetch } = useResumeDetail(params.resumeId);

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Loading preview..." /></Screen>;
  if (isError || !resume) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load this resume." onRetry={refetch} /></Screen>;

  const accent = TEMPLATE_ACCENTS[resume.template];
  const p = resume.personalDetails;
  const contactLine = [p.email, p.phone, p.location].filter(Boolean).join(" · ");

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-6 mt-2 mb-4">
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">Preview Resume</Text>
        </View>
        <Pressable onPress={() => (navigation as any).navigate("DownloadPDF", { resumeId: params.resumeId })}>
          <Ionicons name="share-outline" size={22} color="#111827" />
        </Pressable>
      </View>

      <ScrollView className="px-6" contentContainerStyle={{ paddingBottom: 12 }}>
        <View className="border border-gray-100 rounded-2xl p-5 mb-4" style={{ borderTopWidth: 4, borderTopColor: accent }}>
          <Text className="text-xl font-bold text-gray-900">{p.fullName || "Your Name"}</Text>
          {p.jobTitle ? <Text style={{ color: accent }} className="font-medium mb-2">{p.jobTitle}</Text> : null}
          {contactLine ? <Text className="text-gray-400 text-xs mb-3">{contactLine}</Text> : null}

          {resume.sections.summary ? (
            <>
              <Text className="font-bold text-gray-900 text-sm mb-1">Summary</Text>
              <Text className="text-gray-600 text-sm mb-3">{resume.sections.summary}</Text>
            </>
          ) : null}

          {resume.sections.experience ? (
            <>
              <Text className="font-bold text-gray-900 text-sm mb-1">Experience</Text>
              <Text className="text-gray-600 text-sm mb-3">{resume.sections.experience}</Text>
            </>
          ) : null}

          {resume.education.length > 0 && (
            <>
              <Text className="font-bold text-gray-900 text-sm mb-1">Education</Text>
              {resume.education.map((e) => (
                <Text key={e.id} className="text-gray-600 text-sm mb-1">
                  {e.degree} — {e.institution} ({e.startYear}-{e.endYear})
                </Text>
              ))}
              <View className="mb-2" />
            </>
          )}

          {(resume.skills.technical.length > 0 || resume.skills.soft.length > 0) && (
            <>
              <Text className="font-bold text-gray-900 text-sm mb-1">Skills</Text>
              <Text className="text-gray-600 text-sm">{[...resume.skills.technical, ...resume.skills.soft].join(", ")}</Text>
            </>
          )}
        </View>
      </ScrollView>

      <View className="px-6 py-4 border-t border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-gray-500 text-sm">Template</Text>
          <Pressable
            onPress={() => (navigation as any).navigate("Templates", { resumeId: params.resumeId })}
            className="flex-row items-center"
          >
            <Text className="text-primary font-medium mr-1">{TEMPLATE_LABELS[resume.template]}</Text>
            <Ionicons name="chevron-down" size={14} color="#4F39F6" />
          </Pressable>
        </View>
        <View className="flex-row" style={{ gap: 10 }}>
          <Button label="Previous" variant="outline" className="flex-1" onPress={() => navigation.goBack()} />
          <Button
            label="Next"
            className="flex-1"
            onPress={() => (navigation as any).navigate("ATSScore", { resumeId: params.resumeId })}
          />
        </View>
      </View>
    </Screen>
  );
}

export default PreviewResumeScreen;
