import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, Input, LoadingState, ErrorState } from "@/components/ui";
import { useResumeDetail, useUpdateEducation } from "@/hooks/useResume";
import type { ResumeStackParamList, ResumeEducationEntry } from "@/types";

type Rte = RouteProp<ResumeStackParamList, "Education">;

function emptyEntry(): ResumeEducationEntry {
  return { id: `${Date.now()}`, degree: "", institution: "", startYear: "", endYear: "", percentage: "" };
}

export function EducationScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: resume, isLoading, isError, refetch } = useResumeDetail(params.resumeId);
  const updateEducation = useUpdateEducation(params.resumeId);

  const [entries, setEntries] = useState<ResumeEducationEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (resume) setEntries(resume.education.length > 0 ? resume.education : [emptyEntry()]);
  }, [resume]);

  if (isLoading || entries.length === 0) return <Screen className="items-center justify-center"><LoadingState label="Loading..." /></Screen>;
  if (isError) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load this resume." onRetry={refetch} /></Screen>;

  const updateField = (id: string, field: keyof ResumeEducationEntry, value: string) =>
    setEntries((list) => list.map((e) => (e.id === id ? { ...e, [field]: value } : e)));

  const addEntry = () => {
    const entry = emptyEntry();
    setEntries((list) => [...list, entry]);
    setEditingId(entry.id);
  };

  const removeEntry = (id: string) => setEntries((list) => list.filter((e) => e.id !== id));

  const handleContinue = async () => {
    const valid = entries.filter((e) => e.degree.trim() && e.institution.trim());
    try {
      await updateEducation.mutateAsync(valid);
      (navigation as any).navigate("Skills", { resumeId: params.resumeId });
    } catch (error: any) {
      notify("Couldn't save", error.message ?? "Please try again.");
    }
  };

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-5">
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">Education</Text>
        </View>
        <Pressable onPress={addEntry} className="flex-row items-center">
          <Ionicons name="add" size={18} color="#4F39F6" />
          <Text className="text-primary font-medium ml-1">Add Education</Text>
        </Pressable>
      </View>

      {entries.map((entry) => {
        const isEditing = editingId === entry.id || (!entry.degree && !entry.institution);
        return (
          <View key={entry.id} className="border border-gray-100 rounded-2xl p-4 mb-3">
            {isEditing ? (
              <>
                <Input placeholder="Degree (e.g. B.Tech Computer Science)" value={entry.degree} onChangeText={(v) => updateField(entry.id, "degree", v)} />
                <Input placeholder="Institution" value={entry.institution} onChangeText={(v) => updateField(entry.id, "institution", v)} />
                <View className="flex-row" style={{ gap: 10 }}>
                  <View className="flex-1"><Input placeholder="Start Year" keyboardType="number-pad" value={entry.startYear} onChangeText={(v) => updateField(entry.id, "startYear", v)} /></View>
                  <View className="flex-1"><Input placeholder="End Year" keyboardType="number-pad" value={entry.endYear} onChangeText={(v) => updateField(entry.id, "endYear", v)} /></View>
                </View>
                <Input placeholder="Percentage / CGPA" value={entry.percentage} onChangeText={(v) => updateField(entry.id, "percentage", v)} />
                <Button label="Done" variant="outline" onPress={() => setEditingId(null)} />
              </>
            ) : (
              <Pressable onPress={() => setEditingId(entry.id)}>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">{entry.degree}</Text>
                    <Text className="text-gray-500 text-sm">{entry.institution}</Text>
                    <Text className="text-gray-400 text-xs mt-1">
                      {entry.startYear} - {entry.endYear}
                      {entry.percentage ? ` · ${entry.percentage}%` : ""}
                    </Text>
                  </View>
                  <View className="flex-row" style={{ gap: 12 }}>
                    <Ionicons name="pencil-outline" size={18} color="#6B7280" onPress={() => setEditingId(entry.id)} />
                    <Ionicons name="trash-outline" size={18} color="#DC2626" onPress={() => removeEntry(entry.id)} />
                  </View>
                </View>
              </Pressable>
            )}
          </View>
        );
      })}

      <Button label="Save & Continue" loading={updateEducation.isPending} onPress={handleContinue} className="mt-2 mb-6" />
    </Screen>
  );
}

export default EducationScreen;
