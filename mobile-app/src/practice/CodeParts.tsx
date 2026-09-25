import React from "react";
import { View, Text, TextInput, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PRACTICE_LANGUAGE_LABEL, type CompilerRun, type JudgeResponse } from "@/types/practice.types";
import { MONO_FONT } from "./practiceUi";

/** Horizontal language selector. */
export function LanguageTabs({
  languages,
  value,
  onChange,
}: {
  languages: readonly string[];
  value: string;
  onChange: (lang: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" className="mb-3">
      {languages.map((l) => {
        const active = l === value;
        return (
          <Pressable
            key={l}
            onPress={() => onChange(l)}
            className="px-4 py-2 rounded-full border mr-2"
            style={{ backgroundColor: active ? "#4F39F6" : "#fff", borderColor: active ? "#4F39F6" : "#E5E7EB" }}
          >
            <Text className={active ? "text-white font-medium" : "text-gray-600"}>
              {PRACTICE_LANGUAGE_LABEL[l] ?? l}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/**
 * Plain monospace multiline editor (no highlighting, no dependency). Fully controlled,
 * so the code lives in the parent's state and survives keyboard open/close and
 * language switches.
 */
export function CodeEditor({
  value,
  onChangeText,
  editable = true,
  minHeight = 260,
}: {
  value: string;
  onChangeText?: (v: string) => void;
  editable?: boolean;
  minHeight?: number;
}) {
  return (
    <View className="rounded-2xl border border-gray-800 overflow-hidden" style={{ backgroundColor: "#0F172A" }}>
      <ScrollView horizontal keyboardShouldPersistTaps="handled" contentContainerStyle={{ minWidth: "100%" }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          multiline
          scrollEnabled={false}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          autoComplete="off"
          textAlignVertical="top"
          keyboardType="default"
          selectionColor="#818CF8"
          style={[
            MONO_FONT,
            { color: "#E2E8F0", fontSize: 13, lineHeight: 19, padding: 14, minHeight, minWidth: 320 },
          ]}
        />
      </ScrollView>
    </View>
  );
}

export function StdinBox({ value, onChangeText }: { value: string; onChangeText: (v: string) => void }) {
  return (
    <View className="mt-3">
      <Text className="text-gray-700 text-xs font-semibold mb-1">Input (stdin)</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        placeholder="Optional input for your program"
        placeholderTextColor="#9CA3AF"
        textAlignVertical="top"
        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
        style={[MONO_FONT, { minHeight: 64, fontSize: 13 }]}
      />
    </View>
  );
}

function OutputBlock({ label, text, tone }: { label: string; text: string; tone?: "error" }) {
  if (!text) return null;
  return (
    <View className="mb-2">
      <Text className="text-[11px] font-semibold mb-1" style={{ color: tone === "error" ? "#B91C1C" : "#6B7280" }}>
        {label}
      </Text>
      <ScrollView horizontal>
        <Text selectable style={[MONO_FONT, { fontSize: 12, color: tone === "error" ? "#991B1B" : "#E2E8F0" }]}>
          {text}
        </Text>
      </ScrollView>
    </View>
  );
}

/** Output panel for a plain run. */
export function RunOutput({ run }: { run: CompilerRun }) {
  const ok = run.status === "success";
  const title =
    run.status === "success"
      ? "Finished"
      : run.status === "compile_error"
        ? "Compilation failed"
        : run.status === "timeout"
          ? "Time limit exceeded"
          : "Runtime error";
  const noOutput = !run.stdout && !run.stderr && !run.compileOutput;
  return (
    <View className="mt-4 rounded-2xl p-4" style={{ backgroundColor: "#0F172A" }}>
      <View className="flex-row items-center mb-2">
        <Ionicons name={ok ? "checkmark-circle" : "alert-circle"} size={16} color={ok ? "#4ADE80" : "#F87171"} />
        <Text className="text-white font-semibold text-[13px] ml-1.5">{title}</Text>
        <Text className="text-gray-400 text-[11px] ml-auto">{Math.round(run.timeMs)} ms</Text>
      </View>
      <OutputBlock label="Compiler output" text={run.compileOutput} />
      <OutputBlock label="Output" text={run.stdout} />
      <OutputBlock label="Error" text={run.stderr} tone="error" />
      {noOutput ? <Text className="text-gray-400 text-xs">(no output)</Text> : null}
    </View>
  );
}

/** Per-test-case results for Run Tests / Submit. Hidden cases never show input/expected. */
export function JudgeResults({ result, verdictLabel }: { result: JudgeResponse; verdictLabel?: string }) {
  const { passed, total } = result.summary;
  const all = total > 0 && passed === total;
  return (
    <View className="mt-4">
      <View
        className="rounded-2xl p-4 flex-row items-center"
        style={{ backgroundColor: all ? "#DCFCE7" : "#FEE2E2" }}
      >
        <Ionicons name={all ? "checkmark-circle" : "close-circle"} size={22} color={all ? "#15803D" : "#B91C1C"} />
        <View className="ml-2 flex-1">
          <Text className="font-bold" style={{ color: all ? "#15803D" : "#B91C1C" }}>
            {verdictLabel ?? (all ? "All tests passed" : "Some tests failed")}
          </Text>
          <Text className="text-gray-600 text-xs">
            {passed} / {total} tests passed
          </Text>
        </View>
      </View>

      {result.compileError ? (
        <View className="mt-3 rounded-2xl p-4" style={{ backgroundColor: "#0F172A" }}>
          <OutputBlock label="Compiler output" text={result.compileError} tone="error" />
        </View>
      ) : null}

      {result.results.map((r) => (
        <View key={r.seq} className="mt-3 rounded-2xl border border-gray-200 p-3">
          <View className="flex-row items-center">
            <Ionicons
              name={r.passed ? "checkmark-circle" : "close-circle"}
              size={16}
              color={r.passed ? "#16A34A" : "#DC2626"}
            />
            <Text className="text-gray-900 font-semibold text-[13px] ml-1.5">
              {r.hidden ? "Hidden test" : "Test"} {r.seq}
            </Text>
            <Text className="text-[11px] ml-auto" style={{ color: r.passed ? "#16A34A" : "#DC2626" }}>
              {r.passed ? "Passed" : "Failed"}
            </Text>
          </View>
          {!r.hidden && !r.passed ? (
            <View className="mt-2">
              {r.input !== undefined ? <KV k="Input" v={r.input} /> : null}
              {r.expected !== undefined ? <KV k="Expected" v={r.expected} /> : null}
              {r.actual !== undefined ? <KV k="Your output" v={r.actual} /> : null}
              {r.stderr ? <KV k="Error" v={r.stderr} /> : null}
            </View>
          ) : null}
          {r.note ? <Text className="text-gray-500 text-xs mt-1">{r.note}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <View className="mb-1.5">
      <Text className="text-gray-400 text-[11px] mb-0.5">{k}</Text>
      <ScrollView horizontal>
        <Text selectable style={[MONO_FONT, { fontSize: 12, color: "#111827" }]}>
          {v === "" ? "(empty)" : v}
        </Text>
      </ScrollView>
    </View>
  );
}

/** Amber inline error. `onSignIn` (auth errors only) adds a "Sign in" action. */
export function ErrorBanner({ message, onSignIn, busy }: { message: string; onSignIn?: () => void; busy?: boolean }) {
  return (
    <View className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3">
      <View className="flex-row items-start">
        <Ionicons name="alert-circle" size={18} color="#B45309" />
        <Text className="flex-1 text-amber-900 text-sm ml-2">{message}</Text>
      </View>
      {onSignIn ? (
        <Pressable
          onPress={onSignIn}
          disabled={busy}
          className="self-start mt-2 ml-6 rounded-lg bg-amber-600 px-4 py-2"
          style={{ opacity: busy ? 0.6 : 1 }}
        >
          <Text className="text-white text-sm font-semibold">{busy ? "Signing out..." : "Sign in"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
