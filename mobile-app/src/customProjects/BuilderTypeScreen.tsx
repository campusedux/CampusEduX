import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ui";
import { Skeleton } from "@/components/ui/SkeletonLoader";
import { useCustomPricing } from "@/hooks/useCustomProjects";
import { useBuilderStore } from "./builderStore";
import { WizardScreen } from "./components/wizard";
import { InfoTooltip } from "./components/InfoTooltip";
import { TERMS } from "./components/builderCopy";
import { rupees } from "./components/format";
import { tokenForType, type CustomProjectPricing, type CustomProjectType, type CustomProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "BuilderType">;

const TYPES: { id: CustomProjectType; title: string; icon: keyof typeof Ionicons.glyphMap; what: string; bestFor: string }[] = [
  {
    id: "academic",
    title: "Project Mentoring",
    icon: "school",
    what: "Code review, debugging, architecture guidance and feedback on work you create.",
    bestFor: "For students who will author their own assessed work.",
  },
  {
    id: "personal",
    title: "Personal Project",
    icon: "person",
    what: "An app or website you want for yourself.",
    bestFor: "Best for: portfolio pieces, side projects and ideas you want to try.",
  },
  {
    id: "business",
    title: "Business Project",
    icon: "briefcase",
    what: "A working product for your shop, team or company.",
    bestFor: "Best for: real customers, teams and day-to-day operations.",
  },
];

function startingPrice(pricing: CustomProjectPricing[] | undefined, type: CustomProjectType): number | null {
  const prices = (pricing ?? []).filter((p) => p.projectType === type).map((p) => p.basePrice);
  return prices.length ? Math.min(...prices) : null;
}

export function BuilderTypeScreen() {
  const navigation = useNavigation<Nav>();
  const projectType = useBuilderStore((s) => s.config.projectType);
  const setType = useBuilderStore((s) => s.setType);
  const { data, isLoading, isError, refetch } = useCustomPricing();

  return (
    <WizardScreen
      step={1}
      title="What kind of project do you need?"
      helper="Choose mentoring for student-authored work or software development for personal and business use."
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("BuilderLevel")}
      nextLabel="Continue to level"
      nextDisabled={!projectType || isError}
      disabledReason={!projectType ? "Choose a project type to continue." : undefined}
    >
      {isError ? (
        <ErrorState message="Couldn't load pricing." onRetry={refetch} />
      ) : (
        TYPES.map((t) => {
          const selected = projectType === t.id;
          const from = startingPrice(data?.pricing, t.id);
          return (
            <Pressable
              key={t.id}
              onPress={() => setType(t.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={t.title}
              className="rounded-2xl border px-4 py-4 mb-3"
              style={{ minHeight: 44, borderColor: selected ? "#4F39F6" : "#E5E7EB", backgroundColor: selected ? "#EEF0FF" : "#FFFFFF" }}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: selected ? "#4F39F620" : "#F3F4F6" }}>
                  <Ionicons name={t.icon} size={20} color={selected ? "#4F39F6" : "#6B7280"} />
                </View>
                <Text className={`font-semibold text-base flex-1 ${selected ? "text-primary" : "text-gray-900"}`}>{t.title}</Text>
                <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={20} color={selected ? "#4F39F6" : "#D1D5DB"} />
              </View>
              <Text className="text-gray-700 mt-3">{t.what}</Text>
              <Text className="text-gray-500 text-sm mt-1">{t.bestFor}</Text>
              <View className="flex-row items-center flex-wrap mt-3">
                {isLoading ? (
                  <Skeleton width={150} height={16} />
                ) : (
                  <>
                    <Text className="text-gray-900 font-bold">{from !== null ? `Starting from ${rupees(from)}` : "Pricing unavailable"}</Text>
                    <Text className="text-gray-400 mx-2">·</Text>
                    <Text className="text-gray-600">Token {rupees(tokenForType(t.id, data?.pricing))} to start</Text>
                    <InfoTooltip label={TERMS.token.label} text={TERMS.token.text} />
                  </>
                )}
              </View>
            </Pressable>
          );
        })
      )}
    </WizardScreen>
  );
}

export default BuilderTypeScreen;
