import React, { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { useResumeDetail, useUpdateSkills } from "@/hooks/useResume";
import { ResumeAIAssistPanel } from "@/components/resume/ResumeAIAssistPanel";
import type { ResumeStackParamList } from "@/types";

type Rte = RouteProp<ResumeStackParamList, "Skills">;

const SKILLS_QUICK_ACTIONS = [
  { label: "Suggest skills", instruction: "Suggest additional technical and soft skills based on my resume content." },
];

function SkillChipInput({
  label,
  skills,
  onAdd,
  onRemove,
}: {
  label: string;
  skills: string[];
  onAdd: (skill: string) => void;
  onRemove: (skill: string) => void;
}) {
  const [text, setText] = useState("");
  const submit = () => {
    const value = text.trim();
    if (value) onAdd(value);
    setText("");
  };

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="font-bold text-gray-900">{label}</Text>
      </View>
      <View className="flex-row flex-wrap mb-3">
        {skills.map((skill) => (
          <View key={skill} className="flex-row items-center bg-gray-100 rounded-lg px-3 py-1.5 mr-2 mb-2">
            <Text className="text-gray-700 text-sm mr-1.5">{skill}</Text>
            <Ionicons name="close" size={14} color="#6B7280" onPress={() => onRemove(skill)} />
          </View>
        ))}
      </View>
      <View className="flex-row items-center border border-gray-200 rounded-xl px-3" style={{ height: 44 }}>
        <TextInput
          className="flex-1 text-gray-900"
          placeholder={`Add ${label.toLowerCase()}`}
          placeholderTextColor="#9CA3AF"
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          returnKeyType="done"
        />
        <Pressable onPress={submit}>
          <Ionicons name="add-circle" size={22} color="#4F39F6" />
        </Pressable>
      </View>
    </View>
  );
}

export function SkillsScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: resume, isLoading, isError, refetch } = useResumeDetail(params.resumeId);
  const updateSkills = useUpdateSkills(params.resumeId);

  const [technical, setTechnical] = useState<string[]>([]);
  const [soft, setSoft] = useState<string[]>([]);

  useEffect(() => {
    if (resume) {
      setTechnical(resume.skills.technical);
      setSoft(resume.skills.soft);
    }
  }, [resume]);

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Loading..." /></Screen>;
  if (isError) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load this resume." onRetry={refetch} /></Screen>;

  const handleContinue = async () => {
    try {
      await updateSkills.mutateAsync({ technical, soft });
      (navigation as any).navigate("PreviewResume", { resumeId: params.resumeId });
    } catch (error: any) {
      notify("Couldn't save", error.message ?? "Please try again.");
    }
  };

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Skills</Text>
      </View>

      <SkillChipInput
        label="Technical Skills"
        skills={technical}
        onAdd={(s) => setTechnical((list) => (list.includes(s) ? list : [...list, s]))}
        onRemove={(s) => setTechnical((list) => list.filter((x) => x !== s))}
      />
      <SkillChipInput
        label="Soft Skills"
        skills={soft}
        onAdd={(s) => setSoft((list) => (list.includes(s) ? list : [...list, s]))}
        onRemove={(s) => setSoft((list) => list.filter((x) => x !== s))}
      />

      <ResumeAIAssistPanel
        resumeId={params.resumeId}
        section="skills"
        currentText={[...technical, ...soft].join(", ")}
        quickActions={SKILLS_QUICK_ACTIONS}
        onAccept={(suggestionText) => {
          const suggested = suggestionText
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0 && !technical.includes(s) && !soft.includes(s));
          if (suggested.length > 0) setTechnical((list) => [...list, ...suggested]);
        }}
      />

      <Button label="Save & Continue" loading={updateSkills.isPending} onPress={handleContinue} className="mt-4 mb-6" />
    </Screen>
  );
}

export default SkillsScreen;
