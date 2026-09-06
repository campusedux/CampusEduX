import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, Modal, Alert } from "react-native";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState } from "@/components/ui";
import {
  useResumeDetail,
  useUpdateResumeContent,
  useClearResumeContent,
  useSetResumeDemoFlag,
} from "@/hooks/useResume";
import {
  moveBlock,
  duplicateBlock,
  deleteBlock,
  toggleBlockHidden,
  makeSectionBlock,
  completionItems,
  RESUME_SECTION_TYPES,
  SECTION_LABELS,
} from "@/services/resumeContent";
import type { ResumeContent, ResumeSectionType, ResumeStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<ResumeStackParamList, "ResumeEditor">;
type Rte = RouteProp<ResumeStackParamList, "ResumeEditor">;

const VARIANT_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  text: "document-text-outline",
  entries: "list-outline",
  tags: "pricetags-outline",
  links: "link-outline",
};

export function ResumeEditorScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { data: resume, isLoading, isError, refetch } = useResumeDetail(params.resumeId);
  const updateContent = useUpdateResumeContent(params.resumeId);
  const clearContent = useClearResumeContent(params.resumeId);
  const setDemoFlag = useSetResumeDemoFlag(params.resumeId);

  const [content, setContent] = useState<ResumeContent | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Seed from server once, and re-seed on focus if we have no local edits pending.
  useEffect(() => {
    if (resume && content === null) setContent(resume.content);
  }, [resume, content]);
  useFocusEffect(
    React.useCallback(() => {
      if (resume && !dirty.current) setContent(resume.content);
    }, [resume]),
  );

  function save(next: ResumeContent) {
    dirty.current = true;
    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await updateContent.mutateAsync(next);
        dirty.current = false;
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 700);
  }
  function apply(next: ResumeContent) {
    setContent(next);
    save(next);
  }
  function retrySave() {
    if (content) save(content);
  }

  const completion = useMemo(
    () => (content && resume ? completionItems(content, resume.personalDetails) : []),
    [content, resume],
  );
  const donePct = completion.length ? Math.round((completion.filter((i) => i.done).length / completion.length) * 100) : 0;

  if (isLoading || !content || !resume)
    return (
      <Screen className="items-center justify-center">
        <LoadingState label="Loading résumé..." />
      </Screen>
    );
  if (isError)
    return (
      <Screen className="items-center justify-center px-6">
        <ErrorState message="Couldn't load this résumé." onRetry={refetch} />
      </Screen>
    );

  const addSection = (type: ResumeSectionType) => {
    const block = makeSectionBlock(type);
    apply([...content, block]);
    setAddOpen(false);
    (navigation as any).navigate("SectionEdit", { resumeId: params.resumeId, blockId: block.id });
  };

  const confirmDelete = (id: string, heading: string) =>
    Alert.alert("Delete section?", `"${heading}" will be removed.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => apply(deleteBlock(content, id)) },
    ]);

  const clearDemo = () =>
    Alert.alert("Clear demo content?", "Every section resets to empty. This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await clearContent.mutateAsync();
          await refetch();
          dirty.current = false;
        },
      },
    ]);

  return (
    <Screen edges={["top", "bottom"]} className="px-5">
      <View className="flex-row items-center justify-between mt-2 mb-3">
        <View className="flex-row items-center flex-1">
          <Pressable onPress={() => navigation.goBack()} className="mr-3" hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
            Résumé Editor
          </Text>
        </View>
        {saveState === "error" ? (
          <Pressable onPress={retrySave} className="flex-row items-center" hitSlop={8}>
            <Ionicons name="warning-outline" size={13} color="#DC2626" />
            <Text className="text-xs font-semibold text-red-600 ml-1">Not saved · Retry</Text>
          </Pressable>
        ) : (
          <Text className="text-xs font-medium text-gray-400">
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}
          </Text>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {resume.isDemo && (
          <View className="rounded-xl border border-amber-300 bg-amber-50 p-3 mb-3">
            <Text className="text-amber-900 text-sm font-medium mb-2">This is demo content — replace it with your own.</Text>
            <View className="flex-row" style={{ gap: 14 }}>
              <Pressable onPress={() => (navigation.getParent() as any)?.navigate("Profile")}>
                <Text className="text-primary text-xs font-semibold">Edit in Profile</Text>
              </Pressable>
              <Pressable onPress={clearDemo}>
                <Text className="text-primary text-xs font-semibold">Clear demo content</Text>
              </Pressable>
              <Pressable onPress={() => setDemoFlag.mutate(false)}>
                <Text className="text-gray-500 text-xs font-semibold">This is mine</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Completion */}
        <View className="rounded-xl border border-gray-100 p-3 mb-3">
          <View className="flex-row justify-between mb-1.5">
            <Text className="text-xs font-semibold text-gray-700">Completion</Text>
            <Text className="text-xs text-gray-400">{donePct}%</Text>
          </View>
          <View className="h-1.5 bg-gray-100 rounded-full">
            <View className="h-1.5 bg-primary rounded-full" style={{ width: `${donePct}%` }} />
          </View>
        </View>

        {/* Template */}
        <Pressable
          onPress={() => (navigation as any).navigate("Templates", { resumeId: params.resumeId })}
          className="flex-row items-center justify-between rounded-xl border border-gray-100 px-3 py-3 mb-2"
        >
          <Text className="text-gray-700 text-sm">Template · <Text className="font-semibold capitalize">{resume.template}</Text></Text>
          <Text className="text-primary text-xs font-semibold">Change</Text>
        </Pressable>

        {/* Personal details */}
        <Pressable
          onPress={() => (navigation as any).navigate("PersonalDetails", { resumeId: params.resumeId })}
          className="flex-row items-center justify-between rounded-xl border border-gray-100 px-3 py-3 mb-2"
        >
          <View className="flex-row items-center">
            <Ionicons name="person-outline" size={16} color="#4F39F6" />
            <Text className="text-gray-900 text-sm font-medium ml-2">Personal Details</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </Pressable>

        {/* Sections */}
        <Text className="text-xs font-semibold uppercase text-gray-400 mt-3 mb-2">Sections</Text>
        {content.map((block, index) => (
          <View key={block.id} className="rounded-xl border border-gray-100 px-2 py-2 mb-2">
            <View className="flex-row items-center">
              <Ionicons name={VARIANT_ICON[block.variant] ?? "square-outline"} size={15} color="#6B7280" />
              <Pressable
                className="flex-1 mx-2"
                onPress={() => (navigation as any).navigate("SectionEdit", { resumeId: params.resumeId, blockId: block.id })}
              >
                <Text className={`text-sm ${block.hidden ? "text-gray-400 line-through" : "text-gray-900 font-medium"}`} numberOfLines={1}>
                  {block.heading}
                </Text>
              </Pressable>
            </View>
            <View className="flex-row items-center justify-end mt-1" style={{ gap: 2 }}>
              <IconBtn name="chevron-up" disabled={index === 0} onPress={() => apply(moveBlock(content, block.id, "up"))} />
              <IconBtn name="chevron-down" disabled={index === content.length - 1} onPress={() => apply(moveBlock(content, block.id, "down"))} />
              <IconBtn name={block.hidden ? "eye-off-outline" : "eye-outline"} onPress={() => apply(toggleBlockHidden(content, block.id))} />
              <IconBtn name="copy-outline" onPress={() => apply(duplicateBlock(content, block.id))} />
              <IconBtn name="trash-outline" onPress={() => confirmDelete(block.id, block.heading)} />
            </View>
          </View>
        ))}

        <Pressable
          onPress={() => setAddOpen(true)}
          className="flex-row items-center justify-center rounded-xl border border-dashed border-gray-300 mt-1"
          style={{ height: 48 }}
        >
          <Ionicons name="add" size={18} color="#4F39F6" />
          <Text className="text-primary font-medium text-sm ml-1">Add section</Text>
        </Pressable>
      </ScrollView>

      {/* Sticky action bar */}
      <View className="flex-row border-t border-gray-100 pt-2" style={{ gap: 8 }}>
        <BarButton icon="eye-outline" label="Preview" primary onPress={() => (navigation as any).navigate("PreviewResume", { resumeId: params.resumeId })} />
        <BarButton icon="speedometer-outline" label="ATS" onPress={() => (navigation as any).navigate("ATSScore", { resumeId: params.resumeId })} />
        <BarButton icon="briefcase-outline" label="Job match" onPress={() => (navigation as any).navigate("JdMatch", { resumeId: params.resumeId })} />
        <BarButton icon="download-outline" label="Download" onPress={() => (navigation as any).navigate("DownloadPDF", { resumeId: params.resumeId })} />
      </View>

      {/* Add-section bottom sheet */}
      <Modal visible={addOpen} transparent animationType="slide" onRequestClose={() => setAddOpen(false)}>
        <Pressable className="flex-1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onPress={() => setAddOpen(false)} />
        <View className="bg-white rounded-t-2xl px-5 pb-8" style={{ maxHeight: "72%" }}>
          <View className="items-center pt-2.5 pb-1">
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB" }} />
          </View>
          <View className="flex-row items-center justify-between mb-1 mt-1">
            <Text className="text-base font-bold text-gray-900">Add a section</Text>
            <Pressable onPress={() => setAddOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {ADD_GROUPS.map((group) => (
              <View key={group.label} className="mt-2">
                <Text className="text-[11px] font-bold uppercase text-gray-400 tracking-wide mb-1">{group.label}</Text>
                {group.types.map((type) => (
                  <Pressable key={type} onPress={() => addSection(type)} className="flex-row items-center justify-between py-3 border-b border-gray-100">
                    <Text className="text-gray-800 text-sm">{SECTION_LABELS[type]}</Text>
                    <Ionicons name="add" size={16} color="#4F39F6" />
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}

const ADD_GROUPS: { label: string; types: (typeof RESUME_SECTION_TYPES)[number][] }[] = [
  { label: "Core", types: ["summary", "objective", "experience", "internships", "education", "skills", "projects"] },
  { label: "More", types: ["certifications", "achievements", "awards", "publications", "research", "volunteer", "leadership", "languages", "interests", "coding_profiles", "social_links", "references"] },
  { label: "Custom", types: ["custom"] },
];

function IconBtn({ name, onPress, disabled }: { name: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={disabled ? undefined : onPress} disabled={disabled} hitSlop={6} style={{ padding: 8, opacity: disabled ? 0.3 : 1 }}>
      <Ionicons name={name} size={18} color="#6B7280" />
    </Pressable>
  );
}

function BarButton({ icon, label, onPress, primary }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: "center", justifyContent: "center", height: 50, borderRadius: 12, backgroundColor: primary ? "#4F39F6" : "#F3F4F6" }}>
      <Ionicons name={icon} size={18} color={primary ? "#fff" : "#374151"} />
      <Text style={{ fontSize: 10, fontWeight: "600", marginTop: 2, color: primary ? "#fff" : "#374151" }}>{label}</Text>
    </Pressable>
  );
}

export default ResumeEditorScreen;
