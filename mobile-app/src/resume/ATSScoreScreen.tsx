import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, CircularProgress, LoadingState, ErrorState } from "@/components/ui";
import { useResumeDetail, useATSBreakdown } from "@/hooks/useResume";
import { buildAtsAnalysis, type AtsCategory, type AtsStatus } from "@/services/atsCategories";
import type { CompletionTarget } from "@/services/resumeContent";
import type { ResumeStackParamList } from "@/types";

type Rte = RouteProp<ResumeStackParamList, "ATSScore">;

function overallLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  return "Needs Work";
}

const STATUS: Record<AtsStatus, { text: string; bg: string; fg: string; bar: string }> = {
  strong: { text: "Strong", bg: "#DCFCE7", fg: "#166534", bar: "#16A34A" },
  ok: { text: "OK", bg: "#FEF3C7", fg: "#92400E", bar: "#D97706" },
  weak: { text: "Needs work", bg: "#FEE2E2", fg: "#991B1B", bar: "#DC2626" },
};

function CategoryCard({ category, resumeId }: { category: AtsCategory; resumeId: string }) {
  const navigation = useNavigation();
  const s = STATUS[category.status];

  const improve = () => {
    const t: CompletionTarget | undefined = category.target;
    if (!t) return;
    if (t.kind === "personal") (navigation as any).navigate("PersonalDetails", { resumeId });
    else if (t.kind === "block") (navigation as any).navigate("SectionEdit", { resumeId, blockId: t.blockId });
    else (navigation as any).navigate("ResumeEditor", { resumeId });
  };

  return (
    <View className="rounded-2xl border border-gray-200 p-4 mb-3">
      <View className="flex-row items-center justify-between">
        <Text className="font-bold text-gray-900 text-base">{category.label}</Text>
        <View style={{ backgroundColor: s.bg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text style={{ color: s.fg, fontSize: 10, fontWeight: "700" }}>{s.text}</Text>
        </View>
      </View>
      <View className="flex-row items-baseline mt-0.5">
        <Text className="text-2xl font-bold text-gray-900">{category.score}</Text>
        <Text className="text-gray-400 text-xs ml-1">/ 100</Text>
      </View>
      <View className="h-1.5 bg-gray-100 rounded-full mt-2">
        <View style={{ width: `${category.score}%`, height: 6, borderRadius: 999, backgroundColor: s.bar }} />
      </View>

      <View className="mt-3">
        {category.good.map((g, i) => (
          <View key={`g${i}`} className="flex-row items-start mb-1">
            <Ionicons name="checkmark-circle" size={14} color="#16A34A" style={{ marginTop: 1 }} />
            <Text className="text-gray-600 text-sm ml-1.5 flex-1">{g}</Text>
          </View>
        ))}
        {category.weak.map((w, i) => (
          <View key={`w${i}`} className="flex-row items-start mb-1">
            <Ionicons name="alert-circle" size={14} color="#D97706" style={{ marginTop: 1 }} />
            <Text className="text-gray-600 text-sm ml-1.5 flex-1">{w}</Text>
          </View>
        ))}
      </View>

      {category.suggestions.length > 0 && (
        <View className="bg-gray-50 rounded-xl p-3 mt-2">
          <Text className="text-[10px] font-bold uppercase text-gray-400 mb-1">How to improve</Text>
          {category.suggestions.map((sug, i) => (
            <Text key={i} className="text-gray-600 text-xs mb-0.5">• {sug}</Text>
          ))}
        </View>
      )}

      {category.target && (
        <Pressable onPress={improve} className="flex-row items-center mt-3" hitSlop={6}>
          <Text className="text-primary text-sm font-semibold">Improve {category.label}</Text>
          <Ionicons name="arrow-forward" size={14} color="#4F39F6" style={{ marginLeft: 4 }} />
        </Pressable>
      )}
    </View>
  );
}

export function ATSScoreScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: resume, isLoading: rLoading, isError: rError, refetch: rRefetch } = useResumeDetail(params.resumeId);
  const { data: breakdown, isLoading: bLoading, isError: bError, refetch: bRefetch } = useATSBreakdown(params.resumeId);

  if (rLoading || bLoading)
    return (
      <Screen className="items-center justify-center">
        <LoadingState label="Analysing your résumé..." />
      </Screen>
    );
  if (rError || bError || !resume || !breakdown)
    return (
      <Screen className="items-center justify-center px-6">
        <ErrorState message="Couldn't analyse your résumé." onRetry={() => { rRefetch(); bRefetch(); }} />
      </Screen>
    );

  const analysis = buildAtsAnalysis(breakdown, resume.content, resume.personalDetails);

  return (
    <Screen scroll className="px-5 pb-8">
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} className="mr-3" hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">ATS Check</Text>
        </View>
        <Pressable onPress={() => (navigation as any).navigate("JdMatch", { resumeId: params.resumeId })} hitSlop={8}>
          <Text className="text-primary text-sm font-semibold">Job match</Text>
        </Pressable>
      </View>

      <View className="items-center mb-5">
        <CircularProgress percent={analysis.overall} size={128} sublabel={overallLabel(analysis.overall)} />
        <Text className="text-gray-400 text-xs mt-2">Deterministic score from your résumé&apos;s real content</Text>
      </View>

      {analysis.categories.map((c) => (
        <CategoryCard key={c.key} category={c} resumeId={params.resumeId} />
      ))}

      <Pressable
        onPress={() => (navigation as any).navigate("PreviewResume", { resumeId: params.resumeId })}
        className="items-center justify-center rounded-xl mt-2"
        style={{ height: 48, backgroundColor: "#4F39F6" }}
      >
        <Text className="text-white font-bold">Back to Preview</Text>
      </Pressable>
    </Screen>
  );
}

export default ATSScoreScreen;
