import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState } from "@/components/ui";
import { useCreateResumeFromDemo, useUpdateTemplate, useTemplateCatalog } from "@/hooks/useResume";
import { demoResume } from "@/data/demoResumes";
import { resolveTemplate, DEFAULT_RESOLVED_TEMPLATES, type ResolvedTemplate } from "@/services/resumeTemplateSpecs";
import { ResumeThumbnail } from "@/resume/ResumeThumbnail";
import { TemplatePreviewSheet } from "@/resume/TemplatePreviewSheet";
import type { ResumeStackParamList, ResumeTemplate } from "@/types";

type Nav = NativeStackNavigationProp<ResumeStackParamList, "Templates">;
type Rte = RouteProp<ResumeStackParamList, "Templates">;

export function TemplatesScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const isEditingExisting = !!params?.resumeId;
  const { data: catalog, isLoading } = useTemplateCatalog();
  const createFromDemo = useCreateResumeFromDemo();
  const updateTemplate = useUpdateTemplate(params?.resumeId ?? "");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<ResolvedTemplate | null>(null);

  const templates: ResolvedTemplate[] = (catalog && catalog.length > 0 ? catalog.map(resolveTemplate) : DEFAULT_RESOLVED_TEMPLATES);

  const use = async (template: ResumeTemplate) => {
    setBusyId(template);
    try {
      if (isEditingExisting && params?.resumeId) {
        await updateTemplate.mutateAsync(template);
        (navigation as any).navigate("ResumeEditor", { resumeId: params.resumeId });
      } else {
        const resumeId = await createFromDemo.mutateAsync(template);
        (navigation as any).navigate("ResumeEditor", { resumeId });
      }
      setPreviewing(null);
    } catch (error: any) {
      notify("Couldn't continue", error.message ?? "Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Screen className="px-5">
      <View className="flex-row items-center mt-2 mb-1">
        <Pressable onPress={() => navigation.goBack()} className="mr-3" hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">{isEditingExisting ? "Change Template" : "Choose a Template"}</Text>
      </View>
      <Text className="text-gray-500 text-sm mb-4">
        {isEditingExisting
          ? "Your résumé content stays exactly as-is — only the design changes."
          : "Each template opens with a complete demo résumé you can edit or clear."}
      </Text>

      {isLoading ? (
        <LoadingState label="Loading templates..." />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {templates.map((template) => {
            const demo = demoResume(template.id);
            const busy = busyId === template.id;
            return (
              <View key={template.id} className="rounded-2xl border border-gray-200 mb-4 overflow-hidden bg-white">
                {/* ── Preview window: a controlled A4-proportioned box, fully clipped. ── */}
                <Pressable
                  onPress={() => setPreviewing(template)}
                  accessibilityRole="button"
                  accessibilityLabel={`Preview the ${template.label} template`}
                  style={{ position: "relative" }}
                >
                  <ResumeThumbnail template={template} personalDetails={demo.personalDetails} content={demo.content} />
                  <View style={{ position: "absolute", top: 10, left: 10, flexDirection: "row" }}>
                    {template.atsFriendly && (
                      <View style={{ backgroundColor: "#DCFCE7", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6 }}>
                        <Text style={{ color: "#166534", fontSize: 10, fontWeight: "700" }}>ATS</Text>
                      </View>
                    )}
                    {template.isPremium && (
                      <View style={{ backgroundColor: "#FEF3C7", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: "#92400E", fontSize: 10, fontWeight: "700" }}>PREMIUM</Text>
                      </View>
                    )}
                  </View>
                </Pressable>

                {/* ── Footer: normal document flow, strictly below the preview. ── */}
                <View className="px-4 pt-3 pb-4 border-t border-gray-100">
                  <Text className="font-bold text-gray-900 text-sm">{template.label}</Text>
                  <Text className="text-gray-400 text-xs leading-5 mt-1" numberOfLines={2} style={{ minHeight: 40 }}>
                    {template.description}
                  </Text>
                  <View className="flex-row mt-3" style={{ gap: 10 }}>
                    <Pressable
                      onPress={() => setPreviewing(template)}
                      accessibilityRole="button"
                      accessibilityLabel={`Preview ${template.label}`}
                      className="flex-1 flex-row items-center justify-center rounded-xl border border-gray-200"
                      style={{ height: 44 }}
                    >
                      <Ionicons name="eye-outline" size={16} color="#374151" />
                      <Text className="text-gray-700 text-xs font-semibold ml-1.5">Preview</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => use(template.id)}
                      disabled={busyId != null}
                      accessibilityRole="button"
                      accessibilityLabel={`Use the ${template.label} template`}
                      className="flex-1 flex-row items-center justify-center rounded-xl"
                      style={{ height: 44, backgroundColor: "#4F39F6", opacity: busy ? 0.7 : busyId != null ? 0.45 : 1 }}
                    >
                      <Text className="text-white text-xs font-bold">{busy ? "Opening…" : isEditingExisting ? "Use" : "Use template"}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <TemplatePreviewSheet
        visible={previewing != null}
        template={previewing}
        demo={previewing ? demoResume(previewing.id) : null}
        onClose={() => setPreviewing(null)}
        onUse={() => previewing && use(previewing.id)}
        busy={busyId != null}
      />
    </Screen>
  );
}

export default TemplatesScreen;
