import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { useResumeDetail, useUpdateResumeContent } from "@/hooks/useResume";
import { updateBlock } from "@/services/resumeContent";
import { ResumeAIAssistPanel } from "@/components/resume/ResumeAIAssistPanel";
import { TagInput } from "@/resume/TagInput";
import type { AssistSection } from "@/services/resumeAssist.service";
import type { ResumeContent, ResumeSectionBlock, ResumeSectionEntry, ResumeStackParamList } from "@/types";

type Rte = RouteProp<ResumeStackParamList, "SectionEdit">;

const AI_SECTIONS: Record<string, AssistSection> = { summary: "summary", experience: "experience", internships: "experience", projects: "projects" };

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <View className="mb-3">
      <Text className="text-xs font-medium text-gray-500 mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        placeholderTextColor="#9CA3AF"
        className="border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900"
        style={multiline ? { minHeight: 96, textAlignVertical: "top" } : undefined}
      />
    </View>
  );
}

export function SectionEditScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: resume, isLoading, isError, refetch } = useResumeDetail(params.resumeId);
  const updateContent = useUpdateResumeContent(params.resumeId);

  const [block, setBlock] = useState<ResumeSectionBlock | null>(null);
  const [content, setContent] = useState<ResumeContent | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (resume && content === null) {
      setContent(resume.content);
      setBlock(resume.content.find((b) => b.id === params.blockId) ?? null);
    }
  }, [resume, content, params.blockId]);

  const patch = (changes: Partial<ResumeSectionBlock>) => {
    if (!block || !content) return;
    const nextBlock = { ...block, ...changes };
    const nextContent = updateBlock(content, block.id, changes);
    setBlock(nextBlock);
    setContent(nextContent);
    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await updateContent.mutateAsync(nextContent);
        setSaveState("saved");
      } catch {
        setSaveState("idle");
      }
    }, 700);
  };

  if (isLoading || !block || !content)
    return (
      <Screen className="items-center justify-center">
        <LoadingState label="Loading section..." />
      </Screen>
    );
  if (isError)
    return (
      <Screen className="items-center justify-center px-6">
        <ErrorState message="Couldn't load this section." onRetry={refetch} />
      </Screen>
    );

  const entries = block.entries ?? [];
  const setEntry = (id: string, changes: Partial<ResumeSectionEntry>) =>
    patch({ entries: entries.map((e) => (e.id === id ? { ...e, ...changes } : e)) });
  const emptyEntry = (): ResumeSectionEntry => ({
    id: `ent-${Date.now().toString(36)}`,
    title: "", subtitle: "", location: "", startDate: "", endDate: "", description: "", url: "", tags: [],
  });

  const aiSection = block.variant === "text" || block.variant === "entries" ? AI_SECTIONS[block.type] : undefined;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: "#fff" }}>
      <View className="flex-row items-center justify-between mt-2 mb-3 px-5">
        <View className="flex-row items-center flex-1">
          <Pressable onPress={() => navigation.goBack()} className="mr-3" hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>Edit Section</Text>
        </View>
        <Text className="text-xs font-medium text-gray-400">{saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={8}>
      <ScrollView className="px-5" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
        <Field label="Section heading" value={block.heading} onChange={(v) => patch({ heading: v })} />

        <Pressable onPress={() => patch({ hidden: !block.hidden })} className="flex-row items-center mb-4">
          <Ionicons name={block.hidden ? "eye-off-outline" : "eye-outline"} size={16} color="#6B7280" />
          <Text className="text-gray-600 text-sm ml-2">{block.hidden ? "Hidden — tap to show on résumé" : "Visible on résumé"}</Text>
        </Pressable>

        {block.variant === "text" && (
          <>
            <Field label="Content" value={block.text ?? ""} onChange={(v) => patch({ text: v })} multiline />
            {aiSection && (
              <ResumeAIAssistPanel
                resumeId={params.resumeId}
                section={aiSection}
                currentText={block.text ?? ""}
                quickActions={[
                  { label: "Improve", instruction: "Improve this section — sharper phrasing, same facts." },
                  { label: "Shorten", instruction: "Make this more concise without losing key points." },
                ]}
                onAccept={(t) => patch({ text: t })}
              />
            )}
          </>
        )}

        {block.variant === "entries" &&
          entries.map((entry, i) => (
            <View key={entry.id} className="rounded-2xl border border-gray-200 p-3 mb-3">
              <View className="flex-row justify-end mb-1" style={{ gap: 2 }}>
                <Pressable onPress={() => i > 0 && patch({ entries: swap(entries, i, i - 1) })} className="p-1.5"><Ionicons name="chevron-up" size={15} color={i > 0 ? "#6B7280" : "#D1D5DB"} /></Pressable>
                <Pressable onPress={() => i < entries.length - 1 && patch({ entries: swap(entries, i, i + 1) })} className="p-1.5"><Ionicons name="chevron-down" size={15} color={i < entries.length - 1 ? "#6B7280" : "#D1D5DB"} /></Pressable>
                <Pressable onPress={() => patch({ entries: [...entries.slice(0, i + 1), { ...entry, id: emptyEntry().id }, ...entries.slice(i + 1)] })} className="p-1.5"><Ionicons name="copy-outline" size={15} color="#6B7280" /></Pressable>
                <Pressable onPress={() => patch({ entries: entries.filter((e) => e.id !== entry.id) })} className="p-1.5"><Ionicons name="trash-outline" size={15} color="#6B7280" /></Pressable>
              </View>
              <Field label="Title" value={entry.title} onChange={(v) => setEntry(entry.id, { title: v })} />
              <Field label="Subtitle / company" value={entry.subtitle} onChange={(v) => setEntry(entry.id, { subtitle: v })} />
              <View className="flex-row" style={{ gap: 8 }}>
                <View className="flex-1"><Field label="Start" value={entry.startDate} onChange={(v) => setEntry(entry.id, { startDate: v })} /></View>
                <View className="flex-1"><Field label="End" value={entry.endDate} onChange={(v) => setEntry(entry.id, { endDate: v })} /></View>
              </View>
              <Field label="Location" value={entry.location} onChange={(v) => setEntry(entry.id, { location: v })} />
              <Field label="Details (one bullet per line)" value={entry.description} onChange={(v) => setEntry(entry.id, { description: v })} multiline />
              <Field label="Link (optional)" value={entry.url} onChange={(v) => setEntry(entry.id, { url: v })} />
              <Text className="text-xs font-medium text-gray-500 mb-1">Tags</Text>
              <TagInput tags={entry.tags} onChange={(t) => setEntry(entry.id, { tags: t })} placeholder="e.g. React" />
            </View>
          ))}
        {block.variant === "entries" && (
          <Button label="Add entry" variant="outline" onPress={() => patch({ entries: [...entries, emptyEntry()] })} className="mb-4" />
        )}

        {block.variant === "tags" &&
          (block.groups ?? []).map((group, gi) => (
            <View key={group.id} className="rounded-2xl border border-gray-200 p-3 mb-3">
              <Field label="Group label (optional)" value={group.label} onChange={(v) => patch({ groups: (block.groups ?? []).map((g) => (g.id === group.id ? { ...g, label: v } : g)) })} />
              <Text className="text-xs font-medium text-gray-500 mb-1">Items</Text>
              <TagInput
                tags={group.items}
                onChange={(items) => patch({ groups: (block.groups ?? []).map((g) => (g.id === group.id ? { ...g, items } : g)) })}
                placeholder="Add an item"
              />
              {(block.groups ?? []).length > 1 && (
                <Pressable onPress={() => patch({ groups: (block.groups ?? []).filter((g) => g.id !== group.id) })}>
                  <Text className="text-red-500 text-xs font-semibold">Remove group {gi + 1}</Text>
                </Pressable>
              )}
            </View>
          ))}
        {block.variant === "tags" && (
          <Button
            label="Add group"
            variant="outline"
            onPress={() => patch({ groups: [...(block.groups ?? []), { id: `grp-${Date.now().toString(36)}`, label: "", items: [] }] })}
            className="mb-4"
          />
        )}

        {block.variant === "links" &&
          (block.links ?? []).map((link) => (
            <View key={link.id} className="rounded-2xl border border-gray-200 p-3 mb-3">
              <Field label="Label" value={link.label} onChange={(v) => patch({ links: (block.links ?? []).map((l) => (l.id === link.id ? { ...l, label: v } : l)) })} />
              <Field label="URL" value={link.url} onChange={(v) => patch({ links: (block.links ?? []).map((l) => (l.id === link.id ? { ...l, url: v } : l)) })} />
              {(block.links ?? []).length > 1 && (
                <Pressable onPress={() => patch({ links: (block.links ?? []).filter((l) => l.id !== link.id) })}>
                  <Text className="text-red-500 text-xs font-semibold">Remove</Text>
                </Pressable>
              )}
            </View>
          ))}
        {block.variant === "links" && (
          <Button
            label="Add link"
            variant="outline"
            onPress={() => patch({ links: [...(block.links ?? []), { id: `lnk-${Date.now().toString(36)}`, label: "", url: "" }] })}
            className="mb-4"
          />
        )}

      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#F3F4F6" }}>
        <Button label="Done" onPress={() => navigation.goBack()} />
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function swap<T>(arr: T[], i: number, j: number): T[] {
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export default SectionEditScreen;
