import React, { useEffect, useState } from "react";
import { ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen, Button } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { PracticeApiError, practiceService } from "@/services/practice.service";
import { PRACTICE_LANGUAGES, type CompilerRun, type PracticeLanguage } from "@/types/practice.types";
import type { HomeStackParamList } from "@/types";
import { CodeEditor, ErrorBanner, LanguageTabs, RunOutput, StdinBox } from "./CodeParts";
import { PracticeHeader } from "./practiceUi";
import { STARTER } from "./starters";
import { draftStorage } from "./draftStorage";

type Nav = NativeStackNavigationProp<HomeStackParamList, "PracticeCompiler">;

export function PracticeCompilerScreen() {
  const navigation = useNavigation<Nav>();
  const [lang, setLang] = useState<PracticeLanguage>("java");
  const [codeByLang, setCodeByLang] = useState<Partial<Record<PracticeLanguage, string>>>({});
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { logout } = useAuth();
  const userId = useAuthStore((s) => s.user?.id);
  const [result, setResult] = useState<CompilerRun | null>(null);

  const code = codeByLang[lang] ?? STARTER[lang];

  // Restore (then clear) a draft saved by the "Sign in" action before a sign-out.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    draftStorage.takeCompiler(userId).then((d) => {
      if (cancelled || !d) return;
      if ((PRACTICE_LANGUAGES as readonly string[]).includes(d.language)) setLang(d.language as PracticeLanguage);
      setCodeByLang(d.codeByLang as Partial<Record<PracticeLanguage, string>>);
      setStdin(d.stdin);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const signIn = async () => {
    if (signingOut || !userId) return;
    setSigningOut(true);
    // userId is captured now — logout() clears it from the store.
    await draftStorage.saveCompiler(userId, { language: lang, codeByLang: { ...codeByLang, [lang]: code }, stdin });
    try {
      await logout();
    } catch {
      setSigningOut(false);
      setAuthError(false);
      setError("Couldn't sign you out. Please try again.");
    }
  };

  const run = async () => {
    if (running) return;
    if (!code.trim()) {
      setError("Write some code first.");
      return;
    }
    setRunning(true);
    setError(null);
    setAuthError(false);
    setResult(null);
    try {
      setResult(await practiceService.run({ language: lang, source: code, stdin }));
    } catch (e) {
      setError(e instanceof PracticeApiError || e instanceof Error ? e.message : "Something went wrong.");
      setAuthError(e instanceof PracticeApiError && e.kind === "auth");
    } finally {
      setRunning(false);
    }
  };

  return (
    <Screen>
      <PracticeHeader title="Online Compiler" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          className="px-6"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <LanguageTabs languages={PRACTICE_LANGUAGES} value={lang} onChange={(l) => setLang(l as PracticeLanguage)} />
          <CodeEditor value={code} onChangeText={(v) => setCodeByLang((prev) => ({ ...prev, [lang]: v }))} />
          <StdinBox value={stdin} onChangeText={setStdin} />
          <Button label="Run" leftIcon="play" loading={running} disabled={running} onPress={run} className="mt-4" />

          {error ? <ErrorBanner message={error} onSignIn={authError ? signIn : undefined} busy={signingOut} /> : null}
          {result ? <RunOutput run={result} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export default PracticeCompilerScreen;
