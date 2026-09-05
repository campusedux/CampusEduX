import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState } from "@/components/ui";
import { useResumeDetail, useCreateResume, useUpdateTemplate, useTemplateCatalog } from "@/hooks/useResume";
import type { ResumeStackParamList, ResumeTemplate } from "@/types";

type Nav = NativeStackNavigationProp<ResumeStackParamList, "Templates">;
type Rte = RouteProp<ResumeStackParamList, "Templates">;

export function TemplatesScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const isEditingExisting = !!params?.resumeId;
  const { data: existingResume } = useResumeDetail(params?.resumeId ?? "");
  const { data: templates, isLoading: isLoadingTemplates } = useTemplateCatalog();
  const createResume = useCreateResume();
  const updateTemplate = useUpdateTemplate(params?.resumeId ?? "");

  const [selected, setSelected] = useState<ResumeTemplate>(existingResume?.template ?? "modern");
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    setSubmitting(true);
    try {
      if (isEditingExisting && params?.resumeId) {
        await updateTemplate.mutateAsync(selected);
        (navigation as any).navigate("PreviewResume", { resumeId: params.resumeId });
      } else {
        const resumeId = await createResume.mutateAsync(selected);
        (navigation as any).navigate("PersonalDetails", { resumeId });
      }
    } catch (error: any) {
      notify("Couldn't continue", error.message ?? "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Resume Templates</Text>
      </View>

      {isLoadingTemplates ? (
        <LoadingState label="Loading templates..." />
      ) : (
        <View className="flex-row flex-wrap justify-between mb-6">
          {(templates ?? []).map((template) => {
            const isActive = selected === template.id;
            return (
              <Pressable
                key={template.id}
                onPress={() => setSelected(template.id)}
                className="rounded-2xl border-2 mb-4 overflow-hidden"
                style={{ width: "48%", borderColor: isActive ? template.accentColor : "#E5E7EB" }}
              >
                <View style={{ height: 140, backgroundColor: "#F9FAFB", padding: 12 }}>
                  <View style={{ width: 36, height: 6, backgroundColor: template.accentColor, borderRadius: 3, marginBottom: 8 }} />
                  <View style={{ width: "70%", height: 4, backgroundColor: "#D1D5DB", borderRadius: 2, marginBottom: 6 }} />
                  <View style={{ width: "50%", height: 4, backgroundColor: "#D1D5DB", borderRadius: 2, marginBottom: 14 }} />
                  {[0, 1, 2].map((i) => (
                    <View key={i} style={{ width: "90%", height: 3, backgroundColor: "#E5E7EB", borderRadius: 2, marginBottom: 5 }} />
                  ))}
                </View>
                <View className="flex-row items-center justify-between px-3 py-2">
                  <Text className="font-semibold text-gray-900 text-sm">{template.name}</Text>
                  {isActive && <Ionicons name="checkmark-circle" size={18} color={template.accentColor} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <Button
        label={isEditingExisting ? "Preview Resume" : "Continue"}
        loading={submitting}
        onPress={handleContinue}
        className="mb-6"
      />
    </Screen>
  );
}

export default TemplatesScreen;
