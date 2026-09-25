import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useBuilderStore } from "./builderStore";
import { WizardScreen, SectionCard } from "./components/wizard";
import { TITLE_MIN, isGenericTitle } from "./components/builderCopy";
import type { CustomProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "BuilderDetails">;

const EXAMPLE = {
  title: "Hotel Management System",
  objective: "Manage room bookings, check-in/out and billing for a small hotel.",
  problem: "The hotel tracks bookings on paper, so rooms get double-booked and bills take long to prepare.",
  description:
    "Receptionists log in, see a room grid, create a booking for a guest, check them in and out, and print a bill. The owner sees daily occupancy and income.",
  users: "Hotel receptionists and the hotel owner.",
};

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  why: string;
  maxLength: number;
  multiline?: boolean;
  optional?: boolean;
  error?: string;
  warning?: string;
  onBlur?: () => void;
}

function Field({ label, value, onChangeText, placeholder, why, maxLength, multiline, optional, error, warning, onBlur }: FieldProps) {
  return (
    <View className="mb-4">
      <View className="flex-row justify-between mb-1.5">
        <Text className="text-gray-800 font-medium">
          {label} {optional ? <Text className="text-gray-500 font-normal">(optional)</Text> : <Text style={{ color: "#DC2626" }}>*</Text>}
        </Text>
        <Text className="text-gray-400 text-xs">
          {value.length}/{maxLength}
        </Text>
      </View>
      <TextInput
        value={value}
        onChangeText={(t) => onChangeText(t.slice(0, maxLength))}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        accessibilityLabel={label}
        className="rounded-xl border bg-white px-4 text-base text-gray-900"
        style={{
          minHeight: multiline ? 92 : 50,
          paddingTop: multiline ? 12 : 0,
          textAlignVertical: multiline ? "top" : "center",
          borderColor: error ? "#DC2626" : "#E5E7EB",
        }}
      />
      {error ? (
        <Text className="text-xs mt-1" style={{ color: "#DC2626" }} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : warning ? (
        <Text className="text-xs mt-1" style={{ color: "#B45309" }}>
          {warning}
        </Text>
      ) : null}
      <Text className="text-gray-500 text-xs mt-1">Why we ask: {why}</Text>
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
  const [titleTouched, setTitleTouched] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const title = config.title.trim();
  const titleTooShort = title.length < TITLE_MIN;
  const titleError = (titleTouched || title.length > 0) && titleTooShort ? `Give your project a title of at least ${TITLE_MIN} characters.` : undefined;
  const titleWarning = !titleTooShort && isGenericTitle(title) ? "This title is very generic — a specific name like “Hotel Management System” helps our team understand your project." : undefined;

  const submitRequirement = () => {
    if (!reqText.trim()) return;
    addRequirement(reqText);
    setReqText("");
  };

  return (
    <WizardScreen
      step={4}
      title="Tell us about your project"
      helper="The clearer your details, the closer we can build to what you imagine."
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("BuilderFeatures")}
      nextLabel="Continue to features"
      nextDisabled={titleTooShort}
      disabledReason={titleTooShort ? `Add a project title (at least ${TITLE_MIN} characters) to continue.` : undefined}
    >
      <Pressable
        onPress={() => setShowExample((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: showExample }}
        className="flex-row items-center rounded-xl px-3 mb-4"
        style={{ minHeight: 44, backgroundColor: "#EEF0FF" }}
      >
        <Ionicons name="bulb-outline" size={18} color="#4F39F6" />
        <Text className="text-primary font-semibold ml-2 flex-1">See an example</Text>
        <Ionicons name={showExample ? "chevron-up" : "chevron-down"} size={18} color="#4F39F6" />
      </Pressable>
      {showExample ? (
        <View className="rounded-xl border border-gray-100 bg-white p-4 mb-4">
          <Text className="text-gray-500 text-xs mb-2">A well-filled example — a few plain sentences per field is plenty.</Text>
          {(
            [
              ["Title", EXAMPLE.title],
              ["Objective", EXAMPLE.objective],
              ["Problem statement", EXAMPLE.problem],
              ["Description", EXAMPLE.description],
              ["Target users", EXAMPLE.users],
            ] as const
          ).map(([k, v]) => (
            <View key={k} className="mb-2">
              <Text className="text-gray-500 text-xs font-semibold">{k}</Text>
              <Text className="text-gray-800">{v}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <SectionCard title="1 · Basics">
        <Field
          label="Project title"
          value={config.title}
          onChangeText={(t) => patch({ title: t })}
          onBlur={() => setTitleTouched(true)}
          placeholder="e.g. Hotel Management System"
          why="it names your request so you and our team can find it easily."
          maxLength={80}
          error={titleError}
          warning={titleWarning}
        />
        <Field
          label="Objective"
          value={config.objective}
          onChangeText={(t) => patch({ objective: t })}
          placeholder="e.g. Manage room bookings, check-in/out and billing for a small hotel"
          why="one sentence on what the project should achieve."
          maxLength={200}
          multiline
          optional
        />
      </SectionCard>

      <SectionCard title="2 · Details">
        <Field
          label="Problem statement"
          value={config.problemStatement}
          onChangeText={(t) => patch({ problemStatement: t })}
          placeholder="e.g. Bookings are kept on paper, so rooms get double-booked"
          why="knowing the problem helps us choose the right screens and flows."
          maxLength={500}
          multiline
          optional
        />
        <Field
          label="Description"
          value={config.description}
          onChangeText={(t) => patch({ description: t })}
          placeholder="e.g. Receptionists log in, create a booking, check guests in and out, and print a bill"
          why="the main screens and steps in your own words."
          maxLength={1500}
          multiline
          optional
        />
        <Field
          label="Technology preference"
          value={config.technologyPreference}
          onChangeText={(t) => patch({ technologyPreference: t })}
          placeholder="e.g. React Native + Supabase, Spring Boot, Next.js"
          why="only if your college or team requires a specific stack."
          maxLength={160}
          optional
        />
      </SectionCard>

      <SectionCard title="3 · Users">
        <Field
          label="Target users"
          value={config.targetUsers}
          onChangeText={(t) => patch({ targetUsers: t })}
          placeholder="e.g. Hotel receptionists and the hotel owner"
          why="who uses it decides the roles and screens we build."
          maxLength={200}
          multiline
          optional
        />
      </SectionCard>

      <SectionCard title="Custom requirements (optional)">
        <Text className="text-gray-500 text-sm mb-3">
          Anything not covered by the feature list. Our team reviews these before starting work.
        </Text>
        {config.customRequirements.map((r, i) => (
          <View key={`${r.text}-${i}`} className="flex-row items-center rounded-xl border border-gray-100 px-3 mb-2" style={{ minHeight: 44 }}>
            <Ionicons name="ellipse" size={6} color="#9CA3AF" />
            <Text className="text-gray-700 flex-1 ml-2 py-2">{r.text}</Text>
            <Pressable
              onPress={() => removeRequirement(i)}
              accessibilityRole="button"
              accessibilityLabel={`Remove requirement ${r.text}`}
              hitSlop={8}
              style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </Pressable>
          </View>
        ))}
        <View className="flex-row items-center">
          <TextInput
            value={reqText}
            onChangeText={setReqText}
            placeholder="e.g. Bills must be printable in Hindi"
            placeholderTextColor="#9CA3AF"
            onSubmitEditing={submitRequirement}
            returnKeyType="done"
            accessibilityLabel="Add a custom requirement"
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 text-base text-gray-900"
            style={{ height: 48 }}
          />
          <Pressable
            onPress={submitRequirement}
            accessibilityRole="button"
            accessibilityLabel="Add requirement"
            className="ml-2 rounded-xl items-center justify-center"
            style={{ width: 48, height: 48, backgroundColor: "#EEF0FF" }}
          >
            <Ionicons name="add" size={22} color="#4F39F6" />
          </Pressable>
        </View>
      </SectionCard>
    </WizardScreen>
  );
}

export default BuilderDetailsScreen;
