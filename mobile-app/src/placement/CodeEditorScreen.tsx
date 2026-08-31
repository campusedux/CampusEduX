import React, { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, Chip, LoadingState, ErrorState } from "@/components/ui";
import { notify, notifyThen } from "@/lib/notify";
import {
  useDSAProblemDetail,
  useRunCode,
  useJudgeSolution,
  useMarkProblemSolved,
} from "@/hooks/usePlacement";
import type { JudgeResult, PlacementStackParamList } from "@/types";

type Rte = RouteProp<PlacementStackParamList, "CodeEditor">;
const LANGUAGES = ["python", "javascript", "java", "cpp"] as const;

export function CodeEditorScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: problem, isLoading, isError, refetch } = useDSAProblemDetail(params.problemId);
  const { run, isRunning } = useRunCode();
  const { judge, isJudging } = useJudgeSolution();
  const markSolved = useMarkProblemSolved(params.problemId);

  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]>("python");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState<{ stdout: string; stderr: string } | null>(null);
  const [judgement, setJudgement] = useState<JudgeResult | null>(null);

  useEffect(() => {
    if (problem) setCode(problem.starterCode[language] ?? problem.starterCode.python ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem]);

  const switchLanguage = (lang: (typeof LANGUAGES)[number]) => {
    setLanguage(lang);
    if (problem) setCode(problem.starterCode[lang] ?? "");
    setOutput(null);
    setJudgement(null);
  };

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Loading editor..." /></Screen>;
  if (isError || !problem) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load this problem." onRetry={refetch} /></Screen>;

  const sampleInput = problem.examples[0]?.input ?? "";
  const testCases = problem.examples.map((e) => ({ input: e.input, output: e.output }));

  const handleRun = async () => {
    try {
      setJudgement(null);
      const result = await run(language, code, sampleInput);
      setOutput({ stdout: result.stdout, stderr: result.stderr });
    } catch (error: any) {
      notify("Couldn't run code", error.message ?? "Please try again.");
    }
  };

  const handleSubmit = async () => {
    try {
      const verdict = await judge(language, code, testCases);
      setJudgement(verdict);
      const firstFail = verdict.cases.find((c) => !c.passed);
      setOutput({
        stdout: firstFail?.actual ?? verdict.cases[0]?.actual ?? "",
        stderr: firstFail?.stderr ?? "",
      });

      if (!verdict.allPassed) {
        notify(
          "Wrong Answer",
          `${verdict.passedCount}/${verdict.total} test cases passed. Check the results below.`
        );
        return;
      }

      try {
        await markSolved.mutateAsync();
      } catch (saveError: any) {
        notify(
          "Solution accepted, but not saved",
          saveError?.message ?? "We couldn't record your progress. Please try submitting again."
        );
        return;
      }

      notifyThen(
        "Accepted! ✅",
        `All ${verdict.total} test cases passed.`,
        () => (navigation as any).navigate("SolutionExplanation", { problemId: problem.id })
      );
    } catch (error: any) {
      notify("Couldn't submit code", error.message ?? "Please try again.");
    }
  };

  return (
    <Screen className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-3">
        <View className="flex-row items-center flex-1">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>Code Editor</Text>
        </View>
        <Pressable onPress={() => (navigation as any).navigate("SolutionExplanation", { problemId: problem.id })}>
          <Ionicons name="bulb-outline" size={22} color="#4F39F6" />
        </Pressable>
      </View>

      <View className="flex-row mb-3">
        {LANGUAGES.map((lang) => (
          <Chip key={lang} label={lang} active={language === lang} onPress={() => switchLanguage(lang)} />
        ))}
      </View>

      <TextInput
        value={code}
        onChangeText={setCode}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          fontFamily: "monospace",
          fontSize: 13,
          backgroundColor: "#111827",
          color: "#E5E7EB",
          borderRadius: 12,
          padding: 14,
          height: 220,
          textAlignVertical: "top",
        }}
      />

      {judgement && (
        <View className="bg-gray-50 rounded-xl p-3 mt-3">
          <Text
            className={`text-xs font-bold mb-1 ${judgement.allPassed ? "text-green-700" : "text-danger"}`}
          >
            {judgement.allPassed ? "Accepted" : "Wrong Answer"} · {judgement.passedCount}/{judgement.total} test cases passed
          </Text>
          {judgement.cases.map((c, i) => (
            <View key={i} className="flex-row items-center mt-0.5">
              <Ionicons
                name={c.passed ? "checkmark-circle" : "close-circle"}
                size={13}
                color={c.passed ? "#16A34A" : "#DC2626"}
              />
              <Text className="text-gray-600 text-[11px] font-mono ml-1.5" numberOfLines={1}>
                Case {i + 1}: {c.passed ? "passed" : `expected "${c.expected}", got "${c.actual || c.stderr || "—"}"`}
              </Text>
            </View>
          ))}
        </View>
      )}

      {output && !judgement && (
        <View className="bg-gray-50 rounded-xl p-3 mt-3" style={{ maxHeight: 100 }}>
          <Text className="text-gray-400 text-xs mb-1">Output</Text>
          <Text className="text-gray-800 text-xs font-mono">{output.stdout || "(no output)"}</Text>
          {output.stderr ? <Text className="text-danger text-xs font-mono mt-1">{output.stderr}</Text> : null}
        </View>
      )}

      <View className="flex-row mt-4 mb-6" style={{ gap: 10 }}>
        <Button label="Run" variant="outline" className="flex-1" loading={isRunning} onPress={handleRun} />
        <Button
          label="Submit"
          className="flex-1"
          loading={isJudging || markSolved.isPending}
          onPress={handleSubmit}
        />
      </View>
    </Screen>
  );
}

export default CodeEditorScreen;
