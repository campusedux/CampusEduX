import React from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ResumeDocument } from "@/resume/ResumeDocument";
import { ResumeSheet } from "@/resume/ResumeSheet";
import { buildResumeRenderModel } from "@/services/resumeContent";
import type { ResolvedTemplate } from "@/services/resumeTemplateSpecs";
import type { DemoResume } from "@/data/demoResumes";

/** Full-screen A4 preview of a template's demo persona, opened from a gallery card. */
export function TemplatePreviewSheet({
  visible,
  template,
  demo,
  onClose,
  onUse,
  busy,
}: {
  visible: boolean;
  template: ResolvedTemplate | null;
  demo: DemoResume | null;
  onClose: () => void;
  onUse: () => void;
  busy: boolean;
}) {
  if (!template || !demo) return null;
  const model = buildResumeRenderModel({ personalDetails: demo.personalDetails, content: demo.content });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }} edges={["top", "bottom"]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
          <View style={{ flexShrink: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>{template.label}</Text>
            <Text style={{ fontSize: 12, color: "#9CA3AF" }}>
              Demo: {demo.persona}
              {template.atsFriendly ? "  ·  ATS friendly" : ""}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10} style={{ padding: 6 }}>
            <Ionicons name="close" size={22} color="#6B7280" />
          </Pressable>
        </View>

        <ResumeSheet>
          <ResumeDocument model={model} spec={template} accentColor={template.accentColor} />
        </ResumeSheet>

        <View style={{ flexDirection: "row", gap: 10, padding: 16, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#E5E7EB" }}>
          <Pressable onPress={onClose} style={{ flex: 1, alignItems: "center", justifyContent: "center", height: 46, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB" }}>
            <Text style={{ color: "#374151", fontWeight: "600" }}>Close</Text>
          </Pressable>
          <Pressable onPress={onUse} disabled={busy} style={{ flex: 2, alignItems: "center", justifyContent: "center", height: 46, borderRadius: 12, backgroundColor: "#4F39F6", opacity: busy ? 0.6 : 1 }}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>{busy ? "Opening…" : "Use this template"}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default TemplatePreviewSheet;
