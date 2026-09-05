import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Share } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { notify } from "@/lib/notify";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { useResumeDetail, useTemplateCatalog, useCreateResumeShare } from "@/hooks/useResume";
import type { ResumeStackParamList, ResumeDocument, ResumeFreeformSectionKey, ManageableResumeSectionKey } from "@/types";

type Rte = RouteProp<ResumeStackParamList, "PreviewResume">;

const FALLBACK_ACCENT = "#4F39F6";

const SECTION_HEADINGS: Record<ManageableResumeSectionKey, string> = {
  summary: "Summary",
  education: "Education",
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
  certifications: "Certifications",
  achievements: "Achievements",
  languages: "Languages",
  references: "References",
};

/** Renders one section in the same order/visibility saved from the website editor (resumes_builder.layout) — mirrors website's ResumePreview.tsx. */
function PreviewSection({ sectionKey, resume, accent }: { sectionKey: ManageableResumeSectionKey; resume: ResumeDocument; accent: string }) {
  const heading = (
    <Text style={{ color: accent }} className="font-bold text-sm mb-1 uppercase">
      {SECTION_HEADINGS[sectionKey]}
    </Text>
  );

  if (sectionKey === "education") {
    if (resume.education.length === 0) return null;
    return (
      <View className="mb-3">
        {heading}
        {resume.education.map((e) => (
          <Text key={e.id} className="text-gray-600 text-sm mb-1">
            {e.degree} — {e.institution} ({e.startYear}-{e.endYear})
          </Text>
        ))}
      </View>
    );
  }

  if (sectionKey === "skills") {
    const all = [...resume.skills.technical, ...resume.skills.soft];
    if (all.length === 0) return null;
    return (
      <View className="mb-3">
        {heading}
        <Text className="text-gray-600 text-sm">{all.join(", ")}</Text>
      </View>
    );
  }

  const content = resume.sections[sectionKey as ResumeFreeformSectionKey];
  if (!content?.trim()) return null;
  return (
    <View className="mb-3">
      {heading}
      <Text className="text-gray-600 text-sm">{content}</Text>
    </View>
  );
}

export function PreviewResumeScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: resume, isLoading, isError, refetch } = useResumeDetail(params.resumeId);
  const { data: templates } = useTemplateCatalog();
  const createShare = useCreateResumeShare();
  const [sharing, setSharing] = useState(false);

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Loading preview..." /></Screen>;
  if (isError || !resume) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load this resume." onRetry={refetch} /></Screen>;

  const templateEntry = templates?.find((t) => t.id === resume.template);
  const accent = templateEntry?.accentColor ?? FALLBACK_ACCENT;
  const templateLabel = templateEntry?.name ?? resume.template;
  const p = resume.personalDetails;
  const contactLine = [p.email, p.phone, p.location].filter(Boolean).join(" · ");

  const handleShareLink = async () => {
    setSharing(true);
    try {
      const url = await createShare.mutateAsync(params.resumeId);
      await Share.share({ message: url });
    } catch (error: any) {
      notify("Couldn't create a share link", error.message ?? "Please try again.");
    } finally {
      setSharing(false);
    }
  };

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

          {resume.layout.order
            .filter((key) => !resume.layout.hidden.includes(key))
            .map((key) => (
              <PreviewSection key={key} sectionKey={key} resume={resume} accent={accent} />
            ))}
        </View>
      </ScrollView>

      <View className="px-6 py-4 border-t border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-gray-500 text-sm">Template</Text>
          <Pressable
            onPress={() => (navigation as any).navigate("Templates", { resumeId: params.resumeId })}
            className="flex-row items-center"
          >
            <Text className="text-primary font-medium mr-1">{templateLabel}</Text>
            <Ionicons name="chevron-down" size={14} color="#4F39F6" />
          </Pressable>
        </View>
        <Button
          label="Get a public share link"
          variant="outline"
          loading={sharing}
          onPress={handleShareLink}
          className="mb-3"
        />
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
