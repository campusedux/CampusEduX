import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { MarkdownText } from "@/components/learning/MarkdownText";
import { usePracticeProblem } from "@/hooks/usePractice";
import { PracticeApiError, practiceService } from "@/services/practice.service";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import {
  PRACTICE_LANGUAGES,
  type CompilerRun,
  type JudgeResponse,
  type PracticeLanguage,
  type SubmitResponse,
} from "@/types/practice.types";
import type { HomeStackParamList } from "@/types";
import { CodeEditor, ErrorBanner, JudgeResults, LanguageTabs, RunOutput, StdinBox } from "./CodeParts";
import { DifficultyPill, PracticeHeader, VERDICT_LABEL } from "./practiceUi";
import { STARTER } from "./starters";
import { draftStorage } from "./draftStorage";

type Nav = NativeStackNavigationProp<HomeStackParamList, "PracticeProblem">;
type Rte = RouteProp<HomeStackParamList, "PracticeProblem">;
type Tab = "problem" | "code";
type Busy = "run" | "judge" | "submit" | null;

export function PracticeProblemScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const { logout } = useAuth();
  const { data, isLoading, isError, refetch } = usePracticeProblem(params.slug);

  const [tab, setTab] = useState<Tab>("problem");
  const [lang, setLang] = useState<string | null>(null);
  const [codeByLang, setCodeByLang] = useState<Record<string, string>>({});
  const [stdin, setStdin] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [runResult, setRunResult] = useState<CompilerRun | null>(null);
  const [judgeResult, setJudgeResult] = useState<JudgeResponse | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  // Restore (then clear) a draft saved by the "Sign in" action before a sign-out.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    draftStorage.takeProblem(userId, params.slug).then((d) => {
      if (cancelled || !d) return;
      setLang(d.language);
      setCodeByLang(d.codeByLang);
      setStdin(d.stdin);
      setTab("code");
    });
    return () => {
      cancelled = true;
    };
  }, [userId, params.slug]);

  const languages = useMemo<string[]>(() => {
    const supported = (data?.problem.supported_languages ?? []).filter((l) =>
      (PRACTICE_LANGUAGES as readonly string[]).includes(l),
    );
    return supported.length ? supported : [...PRACTICE_LANGUAGES];
  }, [data]);

  const activeLang = lang && languages.includes(lang) ? lang : languages[0];
  const code =
    codeByLang[activeLang] ??
    data?.problem.starter_code?.[activeLang] ??
    STARTER[activeLang as PracticeLanguage] ??
    "";

  const clearResults = () => {
    setRunResult(null);
    setJudgeResult(null);
    setSubmitResult(null);
    setError(null);
    setAuthError(false);
  };

  const signIn = async () => {
    if (signingOut || !userId) return;
    setSigningOut(true);
    // userId is captured now — logout() clears it from the store.
    await draftStorage.saveProblem(userId, params.slug, { language: activeLang, codeByLang: { ...codeByLang, [activeLang]: code }, stdin });
    try {
      await logout();
    } catch {
      setSigningOut(false);
      setAuthError(false);
      setError("Couldn't sign you out. Please try again.");
    }
  };

  const exec = async (kind: Exclude<Busy, null>) => {
    if (busy) return;
    if (!code.trim()) {
      setError("Write some code first.");
      return;
    }
    clearResults();
    setBusy(kind);
    try {
      if (kind === "run") {
        setRunResult(await practiceService.run({ language: activeLang, source: code, stdin }));
      } else if (kind === "judge") {
        setJudgeResult(await practiceService.judge({ slug: params.slug, language: activeLang, source: code }));
      } else {
        const res = await practiceService.submit({ slug: params.slug, language: activeLang, source: code });
        setSubmitResult(res);
        if (userId) queryClient.invalidateQueries({ queryKey: ["practice", "submissions", userId] });
      }
    } catch (e) {
      setError(e instanceof PracticeApiError || e instanceof Error ? e.message : "Something went wrong.");
      setAuthError(e instanceof PracticeApiError && e.kind === "auth");
    } finally {
      setBusy(null);
    }
  };

  const title = data?.problem.title ?? params.title ?? "Problem";

  return (
    <Screen>
      <PracticeHeader title={title} onBack={() => navigation.goBack()} />
      {isLoading ? (
        <LoadingState label="Loading problem..." />
      ) : isError ? (
        <ErrorState message="Couldn't load this problem." onRetry={() => refetch()} />
      ) : !data ? (
        <ErrorState message="This problem isn't available." onRetry={() => refetch()} />
      ) : (
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View className="flex-row items-center px-6 mb-3" style={{ gap: 10 }}>
            <DifficultyPill difficulty={data.problem.difficulty} />
            {data.category?.name ? <Text className="text-gray-500 text-xs">{data.category.name}</Text> : null}
            {data.problem.is_premium ? (
              <View className="flex-row items-center bg-amber-50 rounded-full px-2 py-0.5">
                <Ionicons name="lock-closed" size={11} color="#B45309" />
                <Text className="text-amber-800 text-[11px] ml-1 font-medium">Premium</Text>
              </View>
            ) : null}
          </View>

          {data.locked ? (
            <View className="px-6">
              <View className="border border-amber-200 bg-amber-50 rounded-2xl p-5 items-center mt-1">
                <Ionicons name="lock-closed" size={26} color="#B45309" />
                <Text className="text-amber-900 font-semibold mt-2 mb-1">Premium problem</Text>
                <Text className="text-amber-800 text-sm text-center mb-4">
                  Upgrade to CampusEduX Premium to read and solve this problem.
                </Text>
                <Button
                  label="See Premium Plans"
                  onPress={() => (navigation.getParent() as any)?.navigate("Premium", { screen: "PremiumPlans" })}
                  className="w-full"
                />
              </View>
            </View>
          ) : (
            <>
              <View className="flex-row mx-6 mb-3 bg-gray-100 rounded-xl p-1">
                {(["problem", "code"] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setTab(t)}
                    className="flex-1 items-center py-2 rounded-lg"
                    style={{ backgroundColor: tab === t ? "#fff" : "transparent" }}
                  >
                    <Text className={tab === t ? "text-primary font-semibold" : "text-gray-500 font-medium"}>
                      {t === "problem" ? "Problem" : "Code"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <ScrollView
                className="px-6"
                contentContainerStyle={{ paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
              >
                {tab === "problem" ? (
                  <ProblemBody
                    data={data}
                    activeLang={activeLang}
                    showSolution={showSolution}
                    onToggleSolution={() => setShowSolution((v) => !v)}
                  />
                ) : (
                  <View>
                    <LanguageTabs languages={languages} value={activeLang} onChange={setLang} />
                    <CodeEditor
                      value={code}
                      onChangeText={(v) => setCodeByLang((prev) => ({ ...prev, [activeLang]: v }))}
                    />
                    <StdinBox value={stdin} onChangeText={setStdin} />

                    <View className="flex-row mt-4" style={{ gap: 8 }}>
                      <Button
                        label="Run"
                        variant="outline"
                        leftIcon="play"
                        loading={busy === "run"}
                        disabled={!!busy}
                        onPress={() => exec("run")}
                        className="flex-1"
                      />
                      <Button
                        label="Run Tests"
                        variant="outline"
                        leftIcon="flask"
                        loading={busy === "judge"}
                        disabled={!!busy}
                        onPress={() => exec("judge")}
                        className="flex-1"
                      />
                    </View>
                    <Button
                      label="Submit"
                      leftIcon="cloud-upload"
                      loading={busy === "submit"}
                      disabled={!!busy}
                      onPress={() => exec("submit")}
                      className="mt-2"
                    />

                    {error ? <ErrorBanner message={error} onSignIn={authError ? signIn : undefined} busy={signingOut} /> : null}
                    {runResult ? <RunOutput run={runResult} /> : null}
                    {judgeResult ? <JudgeResults result={judgeResult} /> : null}
                    {submitResult ? (
                      <>
                        <JudgeResults result={submitResult} verdictLabel={VERDICT_LABEL[submitResult.verdict]} />
                        {submitResult.saved && submitResult.submissionId ? (
                          <Pressable
                            onPress={() => navigation.navigate("PracticeSubmission", { id: submitResult.submissionId! })}
                            className="mt-3 items-center"
                          >
                            <Text className="text-primary font-medium">View this submission</Text>
                          </Pressable>
                        ) : !submitResult.saved ? (
                          <Text className="text-gray-400 text-xs text-center mt-3">
                            Your results are shown above, but this attempt couldn&apos;t be saved.
                          </Text>
                        ) : null}
                      </>
                    ) : null}
                  </View>
                )}
              </ScrollView>
            </>
          )}
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="font-semibold text-gray-900 text-sm mb-1.5">{title}</Text>
      {children}
    </View>
  );
}

function ProblemBody({
  data,
  activeLang,
  showSolution,
  onToggleSolution,
}: {
  data: NonNullable<ReturnType<typeof usePracticeProblem>["data"]>;
  activeLang: string;
  showSolution: boolean;
  onToggleSolution: () => void;
}) {
  const p = data.problem;
  const solution = data.solution_code?.[activeLang];
  const hasSolution = !!(data.editorial || data.solution_approach || solution);
  return (
    <View>
      {p.description ? (
        <Section title="Problem Statement">
          <MarkdownText source={p.description} />
        </Section>
      ) : null}

      {p.examples?.length ? (
        <Section title="Examples">
          {p.examples.map((ex, i) => (
            <View key={i} className="bg-gray-50 rounded-2xl p-4 mb-3">
              <Text className="font-semibold text-gray-900 text-sm mb-1">Example {i + 1}</Text>
              {ex.input !== undefined ? <Text className="text-gray-600 text-sm">Input: {ex.input || "(none)"}</Text> : null}
              {ex.output !== undefined ? <Text className="text-gray-600 text-sm">Output: {ex.output}</Text> : null}
              {ex.explanation ? <Text className="text-gray-400 text-xs mt-1">Explanation: {ex.explanation}</Text> : null}
            </View>
          ))}
        </Section>
      ) : null}

      {p.constraints?.length ? (
        <Section title="Constraints">
          {p.constraints.map((c, i) => (
            <Text key={i} className="text-gray-500 text-sm mb-1">
              • {c}
            </Text>
          ))}
        </Section>
      ) : null}

      {p.hints?.length ? (
        <Section title="Hints">
          {p.hints.map((h, i) => (
            <Text key={i} className="text-gray-500 text-sm mb-1">
              {i + 1}. {h}
            </Text>
          ))}
        </Section>
      ) : null}

      {p.time_complexity || p.space_complexity ? (
        <Text className="text-gray-400 text-xs mb-4">
          {p.time_complexity ? `Time: ${p.time_complexity}` : ""}
          {p.time_complexity && p.space_complexity ? "  ·  " : ""}
          {p.space_complexity ? `Space: ${p.space_complexity}` : ""}
        </Text>
      ) : null}

      {hasSolution ? (
        <View className="mb-2">
          <Pressable onPress={onToggleSolution} className="flex-row items-center">
            <Ionicons name={showSolution ? "chevron-down" : "chevron-forward"} size={16} color="#4F39F6" />
            <Text className="text-primary font-semibold text-sm ml-1">{showSolution ? "Hide solution" : "Show solution"}</Text>
          </Pressable>
          {showSolution ? (
            <View className="mt-3">
              {data.solution_approach ? (
                <Text className="text-gray-600 text-sm leading-5 mb-3">{data.solution_approach}</Text>
              ) : null}
              {data.editorial ? <MarkdownText source={data.editorial} /> : null}
              {solution ? (
                <View className="mt-3">
                  <CodeEditor value={solution} editable={false} minHeight={120} />
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default PracticeProblemScreen;
