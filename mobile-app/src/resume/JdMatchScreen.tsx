import React, { useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, CircularProgress } from "@/components/ui";
import { useMatchResumeToJd } from "@/hooks/useResume";
import type { ResumeStackParamList } from "@/types";

type Rte = RouteProp<ResumeStackParamList, "JdMatch">;

function KeywordChips({ items, tone }: { items: string[]; tone: "match" | "miss" }) {
  const bg = tone === "match" ? "#DCFCE7" : "#F3F4F6";
  const fg = tone === "match" ? "#166534" : "#6B7280";
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {items.length === 0 ? (
        <Text style={{ color: "#9CA3AF", fontSize: 13 }}>None</Text>
      ) : (
        items.map((k) => (
          <Text key={k} style={{ backgroundColor: bg, color: fg, fontSize: 12, fontWeight: "600", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: "hidden" }}>
            {k}
          </Text>
        ))
      )}
    </View>
  );
}

export function JdMatchScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const match = useMatchResumeToJd(params.resumeId);
  const [jd, setJd] = useState("");

  const result = match.data;

  return (
    <Screen edges={["top", "bottom"]}>
      <View className="flex-row items-center px-5 mt-2 mb-3">
        <Pressable onPress={() => navigation.goBack()} className="mr-3" hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Job Description Match</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView className="px-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
          <Text className="text-gray-500 text-sm mb-2">Paste a job description — we&apos;ll compare its keywords against your résumé.</Text>
          <TextInput
            value={jd}
            onChangeText={setJd}
            multiline
            placeholder="Paste the full job description here…"
            placeholderTextColor="#9CA3AF"
            className="border border-gray-200 rounded-xl px-3 py-3 text-gray-900"
            style={{ minHeight: 150, textAlignVertical: "top" }}
          />

          <Button
            label={match.isPending ? "Matching…" : "Check match"}
            loading={match.isPending}
            disabled={jd.trim().length < 20}
            onPress={() => match.mutate(jd.trim())}
            className="mt-3"
          />
          {match.isError && <Text className="text-red-500 text-sm mt-2">Couldn&apos;t run the match. Please try again.</Text>}

          {result && (
            <View className="mt-6">
              <View className="items-center mb-6">
                <CircularProgress percent={result.matchPercent} size={120} sublabel="match" />
                <Text className="text-gray-400 text-xs mt-2">{result.jdKeywordCount} keywords in this JD</Text>
              </View>

              <Text className="text-xs font-bold uppercase text-gray-400 mb-2">Matching keywords</Text>
              <KeywordChips items={result.matched} tone="match" />

              <Text className="text-xs font-bold uppercase text-gray-400 mt-5 mb-2">Missing keywords</Text>
              <KeywordChips items={result.missing} tone="miss" />

              {result.missing.length > 0 && (
                <View className="mt-5 rounded-2xl bg-indigo-50 p-4">
                  <Text className="text-indigo-900 text-sm font-medium mb-1">How to improve</Text>
                  <Text className="text-indigo-800 text-xs">
                    Work the missing keywords into your Summary, Experience bullets or Skills — only where they&apos;re genuinely true for you.
                  </Text>
                </View>
              )}

              <Button label="Back to editor" variant="outline" className="mt-6" onPress={() => (navigation as any).navigate("ResumeEditor", { resumeId: params.resumeId })} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export default JdMatchScreen;
