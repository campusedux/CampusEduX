import React, { useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui";
import { useResumeAssist } from "@/hooks/useResume";
import type { AssistSection } from "@/services/resumeAssist.service";

export interface AssistQuickAction {
  label: string;
  instruction: string;
}

/**
 * Shared AI-assist UI (mobile counterpart of website's
 * ResumeAIAssistPanel.tsx) — same Original/Suggested/Accept/Reject/Edit
 * contract, calling the same /api/resume/assist endpoint.
 */
export function ResumeAIAssistPanel({
  resumeId,
  section,
  currentText,
  quickActions,
  jdText,
  onAccept,
}: {
  resumeId: string;
  section: AssistSection;
  currentText: string;
  quickActions: AssistQuickAction[];
  jdText?: string;
  onAccept: (newText: string) => void;
}) {
  const assist = useResumeAssist();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [editedSuggestion, setEditedSuggestion] = useState("");
  const [editing, setEditing] = useState(false);

  async function requestSuggestion(instruction: string) {
    setOpen(true);
    setError(null);
    setSuggestion(null);
    setEditing(false);
    const result = await assist.mutateAsync({ resumeId, section, currentText, instruction, jdText });
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setSuggestion(result.suggestion);
    setEditedSuggestion(result.suggestion);
  }

  function handleAccept() {
    onAccept(editing ? editedSuggestion : suggestion ?? "");
    reset();
  }

  function reset() {
    setOpen(false);
    setSuggestion(null);
    setError(null);
    setEditing(false);
  }

  return (
    <View className="mt-2">
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {quickActions.map((action) => (
          <Pressable
            key={action.label}
            onPress={() => requestSuggestion(action.instruction)}
            className="flex-row items-center border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white"
          >
            <Ionicons name="sparkles" size={12} color="#4F39F6" />
            <Text className="text-xs font-medium text-gray-900 ml-1">{action.label}</Text>
          </Pressable>
        ))}
      </View>

      {open && (
        <View className="mt-3 border border-gray-200 rounded-2xl p-3 bg-gray-50">
          {assist.isPending && <Text className="text-sm text-gray-500">Thinking…</Text>}
          {error && <Text className="text-sm font-medium text-red-600">{error}</Text>}

          {suggestion && !assist.isPending && (
            <View>
              <Text className="text-xs font-bold text-gray-400 uppercase mb-1">Original</Text>
              <Text className="text-sm text-gray-600 mb-3">{currentText || "(empty)"}</Text>

              <Text className="text-xs font-bold text-primary uppercase mb-1">Suggested</Text>
              {editing ? (
                <TextInput
                  value={editedSuggestion}
                  onChangeText={setEditedSuggestion}
                  multiline
                  className="border border-gray-200 rounded-xl px-3 py-2 text-gray-900 mb-3"
                  style={{ minHeight: 100, textAlignVertical: "top" }}
                />
              ) : (
                <Text className="text-sm text-gray-900 mb-3">{suggestion}</Text>
              )}

              <View className="flex-row items-center" style={{ gap: 10 }}>
                <Button label="Accept" onPress={handleAccept} className="flex-1" />
                <Button label={editing ? "Preview" : "Edit"} variant="outline" onPress={() => setEditing((v) => !v)} className="flex-1" />
                <Button label="Reject" variant="outline" onPress={reset} className="flex-1" />
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default ResumeAIAssistPanel;
