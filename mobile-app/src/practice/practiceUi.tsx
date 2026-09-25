import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SubmissionVerdict } from "@/types/practice.types";

export const DIFF_COLOR: Record<string, string> = { Easy: "#16A34A", Medium: "#F59E0B", Hard: "#DC2626" };
export const DIFF_BG: Record<string, string> = { Easy: "#DCFCE7", Medium: "#FEF3C7", Hard: "#FEE2E2" };

export const VERDICT_LABEL: Record<SubmissionVerdict, string> = {
  accepted: "Accepted",
  wrong_answer: "Wrong Answer",
  compile_error: "Compile Error",
  runtime_error: "Runtime Error",
  time_limit_exceeded: "Time Limit Exceeded",
  error: "Error",
};

/** Monospace face for code — Menlo on iOS, system monospace elsewhere. */
export const MONO_FONT = { fontFamily: "monospace" } as const;

export function DifficultyPill({ difficulty }: { difficulty: string }) {
  return (
    <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: DIFF_BG[difficulty] ?? "#F3F4F6" }}>
      <Text className="text-[11px] font-semibold" style={{ color: DIFF_COLOR[difficulty] ?? "#6B7280" }}>
        {difficulty}
      </Text>
    </View>
  );
}

export function VerdictPill({ verdict }: { verdict: SubmissionVerdict }) {
  const ok = verdict === "accepted";
  return (
    <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: ok ? "#DCFCE7" : "#FEE2E2" }}>
      <Text className="text-[11px] font-semibold" style={{ color: ok ? "#15803D" : "#B91C1C" }}>
        {VERDICT_LABEL[verdict] ?? verdict}
      </Text>
    </View>
  );
}

/** Screen header row: back arrow + title (same pattern as the other detail screens). */
export function PracticeHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View className="flex-row items-center px-6 mt-2 mb-3">
      <Pressable onPress={onBack} hitSlop={8}>
        <Ionicons name="arrow-back" size={22} color="#111827" />
      </Pressable>
      <Text className="text-lg font-bold text-gray-900 ml-3 flex-1" numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

/** Short local date for list rows. */
export function relativeDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
