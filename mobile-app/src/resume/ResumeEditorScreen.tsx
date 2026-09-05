import React, { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { useResumeDetail, useUpdateFreeformSection, useMyCustomProjectsForResume, useAppendProjectToResume } from "@/hooks/useResume";
import { ResumeAIAssistPanel, type AssistQuickAction } from "@/components/resume/ResumeAIAssistPanel";
import type { AssistSection } from "@/services/resumeAssist.service";
import type { ResumeStackParamList, ResumeFreeformSectionKey } from "@/types";

const AI_QUICK_ACTIONS: Partial<Record<ResumeFreeformSectionKey, AssistQuickAction[]>> = {
  summary: [
    { label: "Generate", instruction: "Generate a professional summary from the rest of my resume content." },
    { label: "Improve", instruction: "Improve this summary — sharper phrasing, same facts." },
    { label: "Shorten", instruction: "Shorten this summary to 2-3 sentences without losing the key points." },
    { label: "ATS-friendly", instruction: "Rewrite this to use clearer, more standard ATS-friendly phrasing." },
  ],
  experience: [
    { label: "Improve bullets", instruction: "Improve these bullet points — stronger action verbs, achievement-focused." },
    { label: "Add impact", instruction: "Suggest where measurable impact could be added, without inventing specific numbers." },
  ],
  projects: [
    { label: "Generate", instruction: "Generate a resume-ready project description from this content." },
    { label: "Improve", instruction: "Improve this project description — clearer, more impact-focused." },
  ],
};

type Nav = NativeStackNavigationProp<ResumeStackParamList, "ResumeEditor">;
type Rte = RouteProp<ResumeStackParamList, "ResumeEditor">;

type SectionKey = "personal" | "education" | ResumeFreeformSectionKey | "skills";

const NAV_ITEMS: { key: SectionKey; label: string }[] = [
  { key: "personal", label: "Personal" },
  { key: "education", label: "Education" },
  { key: "experience", label: "Experience" },
  { key: "skills", label: "Skills" },
  { key: "projects", label: "Projects" },
  { key: "certifications", label: "Certifications" },
  { key: "achievements", label: "Achievements" },
  { key: "languages", label: "Languages" },
  { key: "references", label: "References" },
  { key: "summary", label: "Summary" },
];

const FREEFORM_PLACEHOLDERS: Record<string, string> = {
  experience: "e.g. Frontend Intern at Acme Corp (Jun 2025 - Aug 2025)\n- Built responsive UI components with React\n- Improved page load time by 30%",
  projects: "e.g. E-Commerce Website — React, Node.js, MongoDB\n- Built a full-stack shopping app with cart & checkout",
  certifications: "e.g. AWS Certified Cloud Practitioner (2025)",
  achievements: "e.g. Winner, Smart India Hackathon 2025",
  languages: "e.g. English (Fluent), Hindi (Native)",
  references: "Available upon request.",
  summary: "A short 2-3 sentence pitch about who you are and what you're looking for.",
};

export function ResumeEditorScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { data: resume, isLoading, isError, refetch } = useResumeDetail(params.resumeId);
  const updateSection = useUpdateFreeformSection(params.resumeId);
  const appendProject = useAppendProjectToResume(params.resumeId);
  const { data: myProjects } = useMyCustomProjectsForResume();

  const [activeKey, setActiveKey] = useState<SectionKey>("personal");
  const [draft, setDraft] = useState("");
  const [savedRecently, setSavedRecently] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  useEffect(() => {
    if (resume && FREEFORM_PLACEHOLDERS[activeKey] !== undefined) {
      setDraft(resume.sections[activeKey as ResumeFreeformSectionKey] ?? "");
    }
     
  }, [resume, activeKey]);

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Loading resume..." /></Screen>;
  if (isError || !resume) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load this resume." onRetry={refetch} /></Screen>;

  const handleNavItem = (key: SectionKey) => {
    if (key === "personal") return (navigation as any).navigate("PersonalDetails", { resumeId: params.resumeId });
    if (key === "education") return (navigation as any).navigate("Education", { resumeId: params.resumeId });
    if (key === "skills") return (navigation as any).navigate("Skills", { resumeId: params.resumeId });
    setActiveKey(key);
  };

  const handleSaveSection = async () => {
    await updateSection.mutateAsync({ key: activeKey as ResumeFreeformSectionKey, content: draft, currentSections: resume.sections });
    setSavedRecently(true);
    setTimeout(() => setSavedRecently(false), 2000);
  };

  const handleAddProject = async (project: NonNullable<typeof myProjects>[number]) => {
    const nextContent = await appendProject.mutateAsync({ project, currentSections: resume.sections });
    setDraft(nextContent);
    setShowProjectPicker(false);
  };

  const isFreeform = FREEFORM_PLACEHOLDERS[activeKey] !== undefined;

  return (
    <Screen className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <View className="flex-row items-center flex-1">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>Resume Editor</Text>
        </View>
        {savedRecently && (
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
            <Text className="text-green-700 text-xs font-medium ml-1">Saved</Text>
          </View>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44 }} className="mb-4">
        {NAV_ITEMS.map((item) => {
          const isActive = activeKey === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => handleNavItem(item.key)}
              className="px-4 py-2 rounded-full border mr-2"
              style={{ backgroundColor: isActive ? "#4F39F6" : "#fff", borderColor: isActive ? "#4F39F6" : "#E5E7EB" }}
            >
              <Text className={isActive ? "text-white font-medium text-sm" : "text-gray-600 text-sm"}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isFreeform ? (
        <>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-bold text-gray-900 capitalize">{activeKey}</Text>
            {activeKey === "projects" && (
              <Pressable onPress={() => setShowProjectPicker((v) => !v)}>
                <Text className="text-primary text-sm font-medium">
                  {showProjectPicker ? "Close" : "+ Add from My Projects"}
                </Text>
              </Pressable>
            )}
          </View>

          {activeKey === "projects" && showProjectPicker && (
            <View className="border border-gray-200 rounded-xl mb-4 overflow-hidden">
              {!myProjects || myProjects.length === 0 ? (
                <Text className="text-gray-500 text-sm px-4 py-3">
                  No finished custom projects yet — completed Custom Project Builder requests show up here.
                </Text>
              ) : (
                myProjects.map((project, index) => (
                  <View
                    key={project.id}
                    className={`flex-row items-center justify-between px-4 py-3 ${index < myProjects.length - 1 ? "border-b border-gray-100" : ""}`}
                  >
                    <View className="flex-1 mr-3">
                      <Text className="text-gray-900 font-medium" numberOfLines={1}>{project.title}</Text>
                      {!!project.technologyPreference && (
                        <Text className="text-gray-500 text-xs" numberOfLines={1}>{project.technologyPreference}</Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => handleAddProject(project)}
                      disabled={appendProject.isPending}
                      className="px-3 py-1.5 rounded-full bg-primary"
                    >
                      <Text className="text-white text-xs font-semibold">Add</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          )}

          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            placeholder={FREEFORM_PLACEHOLDERS[activeKey]}
            placeholderTextColor="#9CA3AF"
            className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 mb-4"
            style={{ height: 220, textAlignVertical: "top" }}
          />
          <Button label="Save Section" loading={updateSection.isPending} onPress={handleSaveSection} className="mb-2" />

          {AI_QUICK_ACTIONS[activeKey as ResumeFreeformSectionKey] && (
            <View className="mb-4">
              <ResumeAIAssistPanel
                resumeId={params.resumeId}
                section={activeKey as AssistSection}
                currentText={draft}
                quickActions={AI_QUICK_ACTIONS[activeKey as ResumeFreeformSectionKey]!}
                onAccept={setDraft}
              />
            </View>
          )}
        </>
      ) : null}

      <Button
        label="Preview Resume"
        variant="outline"
        onPress={() => (navigation as any).navigate("PreviewResume", { resumeId: params.resumeId })}
        className="mb-6"
      />
    </Screen>
  );
}

export default ResumeEditorScreen;
