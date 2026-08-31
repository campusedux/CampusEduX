import React from "react";
import { View, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LoadingState, ErrorState } from "@/components/ui";
import { useCustomPricing } from "@/hooks/useCustomProjects";
import { useBuilderStore } from "./builderStore";
import { WizardScreen, OptionRow, rupees } from "./components/wizard";
import {
  CUSTOM_PROJECT_TOKENS,
  type CustomProjectLevel,
  type CustomProjectsStackParamList,
} from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "BuilderLevel">;

const LEVELS: { id: CustomProjectLevel; title: string; blurb: string }[] = [
  { id: "standard", title: "Standard", blurb: "Core features, solid and complete." },
  { id: "advanced", title: "Advanced", blurb: "Everything in Standard plus advanced capabilities." },
];

export function BuilderLevelScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useCustomPricing();
  const { projectType, projectLevel } = useBuilderStore((s) => s.config);
  const setLevel = useBuilderStore((s) => s.setLevel);

  if (isLoading) return <LoadingState label="Loading pricing…" />;
  if (isError || !data || !projectType) {
    return <ErrorState message="Couldn't load pricing." onRetry={refetch} />;
  }

  const token = CUSTOM_PROJECT_TOKENS[projectType];
  const baseFor = (level: CustomProjectLevel) =>
    data.pricing.find((p) => p.projectType === projectType && p.projectLevel === level)?.basePrice ?? 0;

  return (
    <WizardScreen
      step={2}
      title="Standard or Advanced?"
      subtitle="This changes the base price and which features are available."
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("BuilderPlatform")}
      nextDisabled={!projectLevel}
    >
      {LEVELS.map((l) => (
        <OptionRow
          key={l.id}
          title={l.title}
          subtitle={l.blurb}
          meta={`Base ${rupees(baseFor(l.id))}`}
          selected={projectLevel === l.id}
          onPress={() => setLevel(l.id)}
        />
      ))}

      <View className="flex-row items-center rounded-xl px-3 py-3 mt-1" style={{ backgroundColor: "#EEF0FF" }}>
        <Ionicons name="information-circle" size={18} color="#4F39F6" />
        <Text className="text-primary text-sm ml-2 flex-1">
          Your project token stays {rupees(token)} whether you pick Standard or Advanced.
        </Text>
      </View>
    </WizardScreen>
  );
}

export default BuilderLevelScreen;
