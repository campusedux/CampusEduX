import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ui";
import { SkeletonList } from "@/components/ui/SkeletonLoader";
import { useBuilderStore } from "./builderStore";
import { useBuilderEstimate } from "./useBuilderEstimate";
import { WizardScreen, OptionRow, SectionCard } from "./components/wizard";
import { InfoTooltip } from "./components/InfoTooltip";
import { LEVEL_LABEL, TERMS, TYPE_LABEL } from "./components/builderCopy";
import { rupees } from "./components/format";
import { isFeatureIncluded } from "@/services/customProjects.service";
import { tokenForType, type CustomProjectLevel, type CustomProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "BuilderLevel">;

const LEVELS: { id: CustomProjectLevel; blurb: string }[] = [
  { id: "standard", blurb: "Core features, solid and complete." },
  { id: "advanced", blurb: "Everything in Standard plus advanced capabilities." },
];

type Cell = "included" | "addon" | "none";

function CellView({ cell }: { cell: Cell }) {
  if (cell === "included") return <Ionicons name="checkmark-circle" size={20} color="#16A34A" accessibilityLabel="Included" />;
  if (cell === "addon") return <Text className="text-gray-500 text-xs font-semibold">Add-on</Text>;
  return <Text className="text-gray-300 text-lg" accessibilityLabel="Not available">—</Text>;
}

export function BuilderLevelScreen() {
  const navigation = useNavigation<Nav>();
  const { pricing, allFeatures, isLoading, isError, refetch } = useBuilderEstimate();
  const { projectType, projectLevel } = useBuilderStore((s) => s.config);
  const setLevel = useBuilderStore((s) => s.setLevel);

  const baseFor = (level: CustomProjectLevel) =>
    pricing?.pricing.find((p) => p.projectType === projectType && p.projectLevel === level)?.basePrice ?? 0;

  // Rows: everything included in either level, plus what only Advanced can offer.
  const rows = useMemo(() => {
    if (!projectType) return [];
    const cellFor = (f: (typeof allFeatures)[number], level: CustomProjectLevel): Cell => {
      if (!f.projectTypes.includes(projectType) || !f.projectLevels.includes(level)) return "none";
      return isFeatureIncluded(f, projectType, level) ? "included" : "addon";
    };
    return allFeatures
      .filter((f) => f.projectTypes.includes(projectType))
      .map((f) => ({ f, std: cellFor(f, "standard"), adv: cellFor(f, "advanced") }))
      .filter((r) => r.std === "included" || r.adv === "included" || (r.std === "none" && r.adv === "addon"))
      .sort((a, b) => a.f.sortOrder - b.f.sortOrder);
  }, [allFeatures, projectType]);
  const sharedAddOns = useMemo(
    () => allFeatures.filter((f) => projectType && f.projectTypes.includes(projectType) && f.projectLevels.length === 2 && !isFeatureIncluded(f, projectType, "advanced")).length,
    [allFeatures, projectType]
  );

  const diff = baseFor("advanced") - baseFor("standard");

  return (
    <WizardScreen
      step={2}
      title="Standard or Advanced?"
      helper="The level sets your base price and which features come included."
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("BuilderPlatform")}
      nextLabel="Continue to platform"
      nextDisabled={!projectLevel || isError}
      disabledReason="Choose a level to continue."
    >
      {isLoading ? (
        <SkeletonList count={3} />
      ) : isError || !projectType ? (
        <ErrorState message="Couldn't load pricing." onRetry={refetch} />
      ) : (
        <>
          <View className="flex-row items-center mb-3">
            <Text className="text-gray-700 font-semibold">{TERMS.level.label}</Text>
            <InfoTooltip label={TERMS.level.label} text={TERMS.level.text} />
          </View>
          {LEVELS.map((l) => (
            <OptionRow
              key={l.id}
              title={LEVEL_LABEL[l.id]}
              subtitle={l.blurb}
              meta={`Base ${rupees(baseFor(l.id))}`}
              selected={projectLevel === l.id}
              onPress={() => setLevel(l.id)}
            />
          ))}

          <SectionCard title={`Compare ${TYPE_LABEL[projectType]} levels`}>
            <View className="flex-row py-2 border-b border-gray-100">
              <Text className="flex-1 text-gray-500 text-xs font-semibold">Feature</Text>
              <Text className="w-20 text-center text-gray-500 text-xs font-semibold">Standard</Text>
              <Text className="w-20 text-center text-gray-500 text-xs font-semibold">Advanced</Text>
            </View>
            {rows.map(({ f, std, adv }) => (
              <View key={f.id} className="flex-row items-center py-2 border-b border-gray-50" accessible accessibilityLabel={`${f.name}: Standard ${std}, Advanced ${adv}`}>
                <Text className="flex-1 text-gray-800 text-sm pr-2">{f.name}</Text>
                <View className="w-20 items-center"><CellView cell={std} /></View>
                <View className="w-20 items-center"><CellView cell={adv} /></View>
              </View>
            ))}
            <View className="flex-row items-center py-2.5">
              <Text className="flex-1 text-gray-900 font-semibold">Base price</Text>
              <Text className="w-20 text-center text-gray-900 font-semibold text-sm">{rupees(baseFor("standard"))}</Text>
              <Text className="w-20 text-center text-gray-900 font-semibold text-sm">{rupees(baseFor("advanced"))}</Text>
            </View>
            <Text className="text-gray-500 text-xs mt-1">
              ✓ Included free · Add-on = optional, paid · — not available at that level.
              {sharedAddOns > 0 ? ` ${sharedAddOns} more optional add-ons are available on both levels.` : ""}
            </Text>
            <Text className="text-gray-900 font-semibold mt-3">
              {diff > 0 ? `+${rupees(diff)} for Advanced` : "Advanced has the same base price"}
            </Text>
          </SectionCard>

          <SectionCard title="Which should I choose?">
            <Text className="text-gray-700 mb-1.5">
              <Text className="font-bold">Standard</Text> — a focused scope for mentoring or a first software version.
            </Text>
            <Text className="text-gray-700">
              <Text className="font-bold">Advanced</Text> — pick it when you want extra capabilities beyond the basics.
            </Text>
          </SectionCard>

          <View className="flex-row items-center rounded-xl px-3 py-3" style={{ backgroundColor: "#EEF0FF" }}>
            <Ionicons name="information-circle" size={18} color="#4F39F6" />
            <Text className="text-primary text-sm ml-2 flex-1">
              Your token stays {rupees(tokenForType(projectType))} for both levels.
            </Text>
          </View>
        </>
      )}
    </WizardScreen>
  );
}

export default BuilderLevelScreen;
