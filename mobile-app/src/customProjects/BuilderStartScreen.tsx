import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState } from "@/components/ui";
import { useCustomProjectDraft } from "@/hooks/useCustomProjects";
import { useBuilderStore } from "./builderStore";
import { CUSTOM_STATUS_LABELS } from "@/types";
import type { CustomProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "BuilderStart">;

const STEPS = [
  "Pick a project type & level",
  "Choose your platform",
  "Describe the project & add requirements",
  "Select features — see a live estimate",
  "Upload an image & reference files",
  "Pay the project token to submit",
];

export function BuilderStartScreen() {
  const navigation = useNavigation<Nav>();
  const { data: draft, isLoading } = useCustomProjectDraft();
  const hydrate = useBuilderStore((s) => s.hydrate);
  const reset = useBuilderStore((s) => s.reset);

  const hasDraft = !!draft && Object.keys(draft).length > 0 && !!draft.projectType;

  const startNew = () => {
    reset();
    navigation.navigate("BuilderType");
  };

  const resumeDraft = () => {
    hydrate(draft ?? null);
    navigation.navigate("BuilderType");
  };

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Custom Project Builder</Text>
      </View>

      <View className="rounded-2xl p-5 mb-5" style={{ backgroundColor: "#4F39F6" }}>
        <Ionicons name="construct" size={26} color="#fff" />
        <Text className="text-white text-lg font-bold mt-2">Build a project made for you</Text>
        <Text className="text-indigo-100 mt-1">
          Configure it step by step, see an estimated price, and pay a small project token to get
          started. Our team builds, tests and delivers it.
        </Text>
      </View>

      <Text className="font-bold text-gray-900 mb-2">How it works</Text>
      {STEPS.map((s, i) => (
        <View key={s} className="flex-row items-start mb-2.5">
          <View className="w-6 h-6 rounded-full items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
            <Text className="text-primary text-xs font-bold">{i + 1}</Text>
          </View>
          <Text className="text-gray-600 flex-1">{s}</Text>
        </View>
      ))}

      <View className="flex-1" />

      {isLoading ? (
        <LoadingState label="Checking for a saved draft…" />
      ) : (
        <>
          {hasDraft ? (
            <View className="rounded-2xl border border-gray-100 p-4 mb-3">
              <Text className="text-gray-900 font-semibold" numberOfLines={1}>
                Draft: {draft?.title || "Untitled project"}
              </Text>
              <Text className="text-gray-400 text-sm mt-0.5">
                {draft?.projectType ? draft.projectType[0].toUpperCase() + draft.projectType.slice(1) : ""}
                {draft?.projectLevel ? ` · ${draft.projectLevel}` : ""} · {CUSTOM_STATUS_LABELS.new}
              </Text>
              <Button label="Resume draft" onPress={resumeDraft} className="mt-3" />
              <Pressable onPress={startNew} className="mt-2 py-2">
                <Text className="text-center text-gray-500">Start a new project instead</Text>
              </Pressable>
            </View>
          ) : (
            <Button label="Start" onPress={startNew} className="mb-2" />
          )}
          <Pressable onPress={() => navigation.navigate("MyCustomProjects")} className="py-3">
            <Text className="text-center text-primary font-medium">View my custom projects</Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

export default BuilderStartScreen;
