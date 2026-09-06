import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { notify } from "@/lib/notify";
import { Screen, Button, LoadingState } from "@/components/ui";
import { useParseUploadedResume, useCreateResumeFromParsed } from "@/hooks/useResume";
import type { ParsedResumeUpload } from "@/services/resume.service";

const ACCEPT = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export function ResumeUploadImportScreen() {
  const navigation = useNavigation();
  const parse = useParseUploadedResume();
  const create = useCreateResumeFromParsed();
  const [review, setReview] = useState<ParsedResumeUpload | null>(null);

  const pick = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ACCEPT, copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.[0]) return;
    const f = res.assets[0];
    try {
      const parsed = await parse.mutateAsync({ uri: f.uri, name: f.name, mimeType: f.mimeType });
      setReview(parsed);
    } catch (e: any) {
      notify("Couldn't read that file", e.message ?? "Try a text-based PDF or DOCX.");
    }
  };

  const doImport = async () => {
    if (!review) return;
    try {
      const id = await create.mutateAsync(review);
      (navigation as any).navigate("ResumeEditor", { resumeId: id });
    } catch (e: any) {
      notify("Couldn't import", e.message ?? "Please try again.");
    }
  };

  const setSection = (key: string, value: string) =>
    setReview((r) => (r ? { ...r, sections: { ...r.sections, [key]: value } } : r));

  return (
    <Screen edges={["top", "bottom"]}>
      <View className="flex-row items-center px-5 mt-2 mb-3">
        <Pressable onPress={() => navigation.goBack()} className="mr-3" hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Upload a résumé</Text>
      </View>

      {parse.isPending ? (
        <LoadingState label="Reading your file…" />
      ) : !review ? (
        <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: 24 }}>
          <Text className="text-gray-500 text-sm mb-4">
            Pick an existing PDF or DOCX résumé. We&apos;ll extract the sections so you can review and import them into a new
            résumé — your existing résumés are never overwritten.
          </Text>
          <Pressable onPress={pick} className="items-center justify-center rounded-2xl border border-dashed border-gray-300 py-10">
            <Ionicons name="cloud-upload-outline" size={30} color="#4F39F6" />
            <Text className="text-primary font-semibold mt-2">Choose PDF or DOCX</Text>
            <Text className="text-gray-400 text-xs mt-1">Max 8 MB · text-based files only</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView className="px-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
          <Text className="text-gray-500 text-sm mb-3">Review what we found, edit anything, then import.</Text>

          <Field label="Name" value={review.contact.fullName ?? ""} onChange={(v) => setReview((r) => (r ? { ...r, contact: { ...r.contact, fullName: v } } : r))} />
          <Field label="Email" value={review.contact.email ?? ""} onChange={(v) => setReview((r) => (r ? { ...r, contact: { ...r.contact, email: v } } : r))} />
          <Field label="Phone" value={review.contact.phone ?? ""} onChange={(v) => setReview((r) => (r ? { ...r, contact: { ...r.contact, phone: v } } : r))} />

          {Object.entries(review.sections)
            .filter(([, v]) => v?.trim())
            .map(([key, value]) => (
              <Field key={key} label={key[0].toUpperCase() + key.slice(1)} value={value} onChange={(v) => setSection(key, v)} multiline />
            ))}

          {review.education.length > 0 && (
            <Text className="text-xs text-gray-400 mt-2">
              + {review.education.length} education entr{review.education.length === 1 ? "y" : "ies"} and {review.skills.length} skill(s) detected
            </Text>
          )}
          {!!review.unrecognizedText && (
            <View className="mt-3 rounded-xl bg-amber-50 p-3">
              <Text className="text-amber-900 text-xs font-medium mb-1">Text we couldn&apos;t place</Text>
              <Text className="text-amber-800 text-xs" numberOfLines={4}>{review.unrecognizedText}</Text>
            </View>
          )}

          <View className="flex-row mt-6" style={{ gap: 10 }}>
            <Button label="Choose another" variant="outline" className="flex-1" onPress={() => setReview(null)} />
            <Button label={create.isPending ? "Importing…" : "Import"} loading={create.isPending} className="flex-1" onPress={doImport} />
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <View className="mb-3">
      <Text className="text-xs font-medium text-gray-500 mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        className="border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900"
        style={multiline ? { minHeight: 84, textAlignVertical: "top" } : undefined}
      />
    </View>
  );
}

export default ResumeUploadImportScreen;
