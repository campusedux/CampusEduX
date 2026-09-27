import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet, Button } from "@/components/ui";
import { confirmAction, notify } from "@/lib/notify";
import { CUSTOM_UPLOAD_MAX_MB, CUSTOM_UPLOAD_MIME_TYPES } from "@/lib/uploadMime";
import type { CustomProjectReferenceFile, CustomProjectRequestDetail, CustomProjectRequestEdit } from "@/types";

type TextKey = "title" | "objective" | "problem_statement" | "description" | "target_users" | "technology_preference";

const FIELDS: { key: TextKey; label: string; max: number; multiline?: boolean }[] = [
  { key: "title", label: "Title", max: 200 },
  { key: "objective", label: "Objective", max: 5000, multiline: true },
  { key: "problem_statement", label: "Problem statement", max: 5000, multiline: true },
  { key: "description", label: "Description", max: 10000, multiline: true },
  { key: "target_users", label: "Target users", max: 2000, multiline: true },
  { key: "technology_preference", label: "Tech stack", max: 500 },
];

function initialValues(d: CustomProjectRequestDetail): Record<TextKey, string> & { deadline: string; requirements: string[] } {
  return {
    title: d.title,
    objective: d.objective,
    problem_statement: d.problemStatement,
    description: d.description,
    target_users: d.targetUsers,
    technology_preference: d.technologyPreference,
    deadline: d.deadline ?? "",
    requirements: d.customRequirements.map((r) => r.text),
  };
}

type Mutation<T> = { mutateAsync: (v: T) => Promise<unknown>; isPending: boolean };

/**
 * Owner "Edit request" — only opened while the request is still "new"; custom_project_update_request()
 * enforces the same lock and rejects any price field. The project value is not editable here.
 */
export function EditRequestSheet({
  visible,
  onClose,
  detail,
  updateRequest,
  addAttachment,
  removeAttachment,
}: {
  visible: boolean;
  onClose: () => void;
  detail: CustomProjectRequestDetail;
  updateRequest: Mutation<CustomProjectRequestEdit>;
  addAttachment: Mutation<{ uri: string; name: string; mimeType?: string }>;
  removeAttachment: Mutation<string>;
}) {
  const [form, setForm] = useState(() => initialValues(detail));
  useEffect(() => {
    if (visible) setForm(initialValues(detail));
  }, [visible, detail]);

  const save = async () => {
    const init = initialValues(detail);
    const changes: CustomProjectRequestEdit = {};
    for (const f of FIELDS) if (form[f.key].trim() !== init[f.key].trim()) changes[f.key] = form[f.key];
    const reqs = form.requirements.map((r) => r.trim()).filter(Boolean);
    if (JSON.stringify(reqs) !== JSON.stringify(init.requirements)) changes.custom_requirements = reqs.map((text) => ({ text }));
    const deadline = form.deadline.trim();
    if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      notify("Check the deadline", "Use the format YYYY-MM-DD, e.g. 2026-12-31.");
      return;
    }
    if ((deadline || null) !== (init.deadline || null)) changes.deadline = deadline || null;
    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }
    try {
      await updateRequest.mutateAsync(changes);
      notify("Request updated", "The team has been notified.");
      onClose();
    } catch (e) {
      notify("Could not save", e instanceof Error ? e.message : "Please try again.");
    }
  };

  const pickFiles = async () => {
    if (detail.referenceFiles.length >= 20) {
      notify("Limit reached", "You can attach up to 20 files.");
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({ type: [...CUSTOM_UPLOAD_MIME_TYPES], multiple: true, copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.length) return;
    for (const asset of result.assets) {
      if ((asset.size ?? 0) / (1024 * 1024) > CUSTOM_UPLOAD_MAX_MB) {
        notify("File too large", `“${asset.name}” is over ${CUSTOM_UPLOAD_MAX_MB} MB.`);
        continue;
      }
      try {
        await addAttachment.mutateAsync({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? undefined });
      } catch (e) {
        notify(`Could not attach “${asset.name}”`, e instanceof Error ? e.message : "Please try again.");
      }
    }
  };

  const confirmRemove = (f: CustomProjectReferenceFile) =>
    confirmAction(
      "Remove attachment?",
      f.fileName || f.label,
      async () => {
        try {
          await removeAttachment.mutateAsync(f.id);
        } catch (e) {
          notify("Could not remove", e instanceof Error ? e.message : "Please try again.");
        }
      },
      "Remove"
    );

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Edit request" scroll>
      <Text className="text-gray-500 text-xs mb-3">
        You can edit these details until work starts. The project value is set by the CampusEduX team.
      </Text>
      {FIELDS.map((f) => (
        <View key={f.key} className="mb-3">
          <Text className="text-sm font-semibold text-gray-700 mb-1.5">{f.label}</Text>
          <TextInput
            value={form[f.key]}
            onChangeText={(t) => setForm((s) => ({ ...s, [f.key]: t }))}
            maxLength={f.max}
            multiline={f.multiline}
            accessibilityLabel={f.label}
            className="rounded-xl border border-gray-200 bg-white px-3 text-gray-900"
            style={f.multiline ? { minHeight: 84, paddingVertical: 10, textAlignVertical: "top" } : { height: 48 }}
          />
        </View>
      ))}

      <Text className="text-sm font-semibold text-gray-700 mb-1.5">Deadline (optional)</Text>
      <TextInput
        value={form.deadline}
        onChangeText={(t) => setForm((s) => ({ ...s, deadline: t }))}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#9CA3AF"
        maxLength={10}
        keyboardType="numbers-and-punctuation"
        accessibilityLabel="Deadline"
        className="rounded-xl border border-gray-200 bg-white px-3 text-gray-900 mb-3"
        style={{ height: 48 }}
      />

      <Text className="text-sm font-semibold text-gray-700 mb-1.5">Requirements</Text>
      {form.requirements.map((r, i) => (
        <View key={i} className="flex-row items-center mb-2">
          <TextInput
            value={r}
            onChangeText={(t) =>
              setForm((s) => {
                const next = [...s.requirements];
                next[i] = t;
                return { ...s, requirements: next };
              })
            }
            maxLength={500}
            accessibilityLabel={`Requirement ${i + 1}`}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 text-gray-900"
            style={{ height: 46 }}
          />
          <Pressable
            onPress={() => setForm((s) => ({ ...s, requirements: s.requirements.filter((_, j) => j !== i) }))}
            accessibilityRole="button"
            accessibilityLabel={`Remove requirement ${i + 1}`}
            className="ml-2 w-11 h-11 items-center justify-center"
          >
            <Ionicons name="close" size={20} color="#6B7280" />
          </Pressable>
        </View>
      ))}
      {form.requirements.length < 30 ? (
        <Pressable onPress={() => setForm((s) => ({ ...s, requirements: [...s.requirements, ""] }))} accessibilityRole="button" className="py-2 mb-3">
          <Text className="text-primary font-semibold">+ Add requirement</Text>
        </Pressable>
      ) : null}

      <Text className="text-sm font-semibold text-gray-700 mb-1.5">Attachments</Text>
      {detail.referenceFiles.map((f) => (
        <View key={f.id} className="flex-row items-center rounded-xl border border-gray-100 px-3 py-2.5 mb-2">
          <Ionicons name="document-attach-outline" size={18} color="#6B7280" />
          <Text className="flex-1 text-gray-700 ml-2" numberOfLines={1}>
            {f.fileName || f.label}
          </Text>
          <Pressable onPress={() => confirmRemove(f)} accessibilityRole="button" accessibilityLabel={`Remove ${f.fileName}`} className="px-2 py-1">
            <Text className="font-semibold" style={{ color: "#DC2626" }}>
              Remove
            </Text>
          </Pressable>
        </View>
      ))}
      <Pressable
        onPress={pickFiles}
        disabled={addAttachment.isPending}
        accessibilityRole="button"
        className="flex-row items-center rounded-xl border border-dashed border-gray-300 px-3 py-3 mb-4"
      >
        {addAttachment.isPending ? <ActivityIndicator color="#4F39F6" /> : <Ionicons name="attach" size={18} color="#4F39F6" />}
        <Text className="text-primary font-semibold ml-2">Add file</Text>
      </Pressable>

      <View className="flex-row" style={{ gap: 10 }}>
        <View className="flex-1">
          <Button label="Cancel" variant="outline" onPress={onClose} disabled={updateRequest.isPending} />
        </View>
        <View className="flex-1">
          <Button label="Save changes" onPress={save} loading={updateRequest.isPending} />
        </View>
      </View>
    </BottomSheet>
  );
}

export default EditRequestSheet;
