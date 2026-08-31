import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useBuilderStore } from "./builderStore";
import { WizardScreen } from "./components/wizard";
import type { CustomProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "BuilderDetails">;

function LabeledField({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength,
  multiline,
  optional,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  maxLength: number;
  multiline?: boolean;
  optional?: boolean;
}) {
  return (
    <View className="mb-4">
      <View className="flex-row justify-between mb-1.5">
        <Text className="text-gray-700 font-medium">
          {label} {optional ? <Text className="text-gray-400 font-normal">(optional)</Text> : null}
        </Text>
        <Text className="text-gray-300 text-xs">
          {value.length}/{maxLength}
        </Text>
      </View>
      <TextInput
        value={value}
        onChangeText={(t) => onChangeText(t.slice(0, maxLength))}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        className="rounded-xl border border-gray-200 bg-white px-4 text-base text-gray-900"
        style={{ minHeight: multiline ? 92 : 50, paddingTop: multiline ? 12 : 0, textAlignVertical: multiline ? "top" : "center" }}
      />
    </View>
  );
}

export function BuilderDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const config = useBuilderStore((s) => s.config);
  const patch = useBuilderStore((s) => s.patch);
  const addRequirement = useBuilderStore((s) => s.addRequirement);
  const removeRequirement = useBuilderStore((s) => s.removeRequirement);
  const [reqText, setReqText] = useState("");

  const submitRequirement = () => {
    if (!reqText.trim()) return;
    addRequirement(reqText);
    setReqText("");
  };

  return (
    <WizardScreen
      step={4}
      title="Project details"
      subtitle="Tell us what you want built. Be as specific as you can."
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("BuilderFeatures")}
      nextDisabled={config.title.trim().length < 3}
    >
      <LabeledField
        label="Project title"
        value={config.title}
        onChangeText={(t) => patch({ title: t })}
        placeholder="e.g. Campus event management app"
        maxLength={80}
      />
      <LabeledField
        label="Objective"
        value={config.objective}
        onChangeText={(t) => patch({ objective: t })}
        placeholder="What should this project achieve?"
        maxLength={200}
        multiline
        optional
      />
      <LabeledField
        label="Problem statement"
        value={config.problemStatement}
        onChangeText={(t) => patch({ problemStatement: t })}
        placeholder="What problem does it solve?"
        maxLength={500}
        multiline
        optional
      />
      <LabeledField
        label="Description"
        value={config.description}
        onChangeText={(t) => patch({ description: t })}
        placeholder="Describe the main screens, flows and rules."
        maxLength={1500}
        multiline
        optional
      />
      <LabeledField
        label="Target users"
        value={config.targetUsers}
        onChangeText={(t) => patch({ targetUsers: t })}
        placeholder="Who will use it?"
        maxLength={200}
        multiline
        optional
      />
      <LabeledField
        label="Technology preference"
        value={config.technologyPreference}
        onChangeText={(t) => patch({ technologyPreference: t })}
        placeholder="e.g. React Native + Supabase, Spring Boot, Next.js…"
        maxLength={160}
        optional
      />

      <Text className="text-gray-700 font-medium mt-2 mb-2">Custom requirements</Text>
      <Text className="text-gray-400 text-sm mb-3">
        Anything not covered by the feature list. These are noted for the team and do not add a
        price.
      </Text>

      {config.customRequirements.map((r, i) => (
        <View key={`${r.text}-${i}`} className="flex-row items-center rounded-xl border border-gray-100 px-3 py-2.5 mb-2">
          <Ionicons name="ellipse" size={6} color="#9CA3AF" />
          <Text className="text-gray-700 flex-1 ml-2">{r.text}</Text>
          <Pressable onPress={() => removeRequirement(i)} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#D1D5DB" />
          </Pressable>
        </View>
      ))}

      <View className="flex-row items-center mt-1">
        <TextInput
          value={reqText}
          onChangeText={setReqText}
          placeholder="Add a custom requirement"
          placeholderTextColor="#9CA3AF"
          onSubmitEditing={submitRequirement}
          returnKeyType="done"
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 text-base text-gray-900"
          style={{ height: 48 }}
        />
        <Pressable
          onPress={submitRequirement}
          className="ml-2 w-12 h-12 rounded-xl items-center justify-center"
          style={{ backgroundColor: "#EEF0FF" }}
        >
          <Ionicons name="add" size={22} color="#4F39F6" />
        </Pressable>
      </View>
    </WizardScreen>
  );
}

export default BuilderDetailsScreen;
