import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ui";
import { SkeletonList } from "@/components/ui/SkeletonLoader";
import { isFeatureIncluded, priceForFeature } from "@/services/customProjects.service";
import { useBuilderStore } from "./builderStore";
import { useBuilderEstimate } from "./useBuilderEstimate";
import { WizardScreen } from "./components/wizard";
import { FeatureIncludedList } from "./components/FeatureIncludedList";
import { AddOnCard } from "./components/AddOnCard";
import { InfoTooltip } from "./components/InfoTooltip";
import { LEVEL_LABEL, TERMS } from "./components/builderCopy";
import { rupees } from "./components/format";
import type { CustomFeature, CustomProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "BuilderFeatures">;

const ALL = "All";

export function BuilderFeaturesScreen() {
  const navigation = useNavigation<Nav>();
  const { config, estimate, included, addOnCatalog, lockedFeatures, allFeatures, isLoading, isError, refetch } = useBuilderEstimate();
  const toggleFeature = useBuilderStore((s) => s.toggleFeature);
  const { projectType, projectLevel } = config;

  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  useEffect(() => {
    const next = rawSearch.trim().toLowerCase();
    if (next === search) return;
    const t = setTimeout(() => setSearch(next), 250);
    return () => clearTimeout(t);
  }, [rawSearch, search]);

  const categories = useMemo(
    () => [ALL, ...Array.from(new Set([...addOnCatalog, ...lockedFeatures].map((f) => f.category)))],
    [addOnCatalog, lockedFeatures]
  );

  const matches = (f: CustomFeature) =>
    (category === ALL || f.category === category) &&
    (!search || f.name.toLowerCase().includes(search) || f.description.toLowerCase().includes(search));
  const visibleAddOns = addOnCatalog.filter(matches);
  const visibleLocked = lockedFeatures.filter(matches);

  // "Also adds" — dependencies that are paid; ones already included are satisfied for free.
  const nameById = useMemo(() => new Map(allFeatures.map((f) => [f.id, f])), [allFeatures]);
  const requiresFor = (f: CustomFeature): string[] =>
    (f.dependencies ?? [])
      .map((d) => nameById.get(d))
      .filter((d): d is CustomFeature => !!d && !isFeatureIncluded(d, projectType, projectLevel) && !config.featureIds.includes(d.id))
      .map((d) => d.name);

  const levelLabel = projectLevel ? LEVEL_LABEL[projectLevel] : "";
  const nothingToAdd = addOnCatalog.length === 0 && lockedFeatures.length === 0;

  return (
    <WizardScreen
      step={5}
      title="Features"
      helper="See what already comes with your project, then add any extras you want."
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("BuilderUploads")}
      nextLabel="Continue to uploads"
      nextDisabled={isError}
    >
      {isLoading ? (
        <SkeletonList count={4} />
      ) : isError ? (
        <ErrorState message="Couldn't load the feature catalog." onRetry={refetch} />
      ) : (
        <>
          {/* SECTION A — included, free, read-only */}
          <FeatureIncludedList features={included} levelLabel={levelLabel} />

          {/* SECTION B — optional, paid */}
          <View className="mt-2">
            <View className="flex-row items-center">
              <Ionicons name="add-circle-outline" size={20} color="#4F39F6" />
              <Text className="text-gray-900 font-bold text-base ml-2">Add extra features</Text>
              <InfoTooltip label={TERMS.addOn.label} text={TERMS.addOn.text} />
            </View>
            <Text className="text-gray-600 text-sm mt-1 mb-3">
              Want more? Add any of these. Each price is added to your estimate.
            </Text>

            {nothingToAdd ? (
              <View className="rounded-2xl border border-gray-100 bg-white p-5 items-center">
                <Ionicons name="checkmark-done-circle-outline" size={32} color="#16A34A" />
                <Text className="text-gray-900 font-semibold mt-2">No extra features for this project</Text>
                <Text className="text-gray-500 text-sm text-center mt-1">
                  Everything available for a {levelLabel} {projectType} project is already included.
                </Text>
              </View>
            ) : (
              <>
                <View className="flex-row items-center rounded-xl border border-gray-200 bg-white px-3 mb-3" style={{ height: 48 }}>
                  <Ionicons name="search" size={18} color="#9CA3AF" />
                  <TextInput
                    value={rawSearch}
                    onChangeText={setRawSearch}
                    placeholder="Search add-on features"
                    placeholderTextColor="#9CA3AF"
                    accessibilityLabel="Search add-on features"
                    className="flex-1 ml-2 text-base text-gray-900"
                  />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerStyle={{ gap: 8 }}>
                  {categories.map((c) => {
                    const on = category === c;
                    return (
                      <Pressable
                        key={c}
                        onPress={() => setCategory(c)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={`Filter: ${c}`}
                        className="rounded-full px-4 items-center justify-center"
                        style={{ minHeight: 44, backgroundColor: on ? "#4F39F6" : "#F3F4F6" }}
                      >
                        <Text className={`text-sm font-medium ${on ? "text-white" : "text-gray-700"}`}>{c}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View className="flex-row items-center justify-between rounded-xl px-3 mb-3" style={{ minHeight: 44, backgroundColor: "#EEF0FF" }} accessibilityLiveRegion="polite">
                  <Text className="text-primary font-semibold">
                    {estimate.addOns.length} add-on{estimate.addOns.length === 1 ? "" : "s"}
                  </Text>
                  <Text className="text-primary font-bold">+{rupees(estimate.addOnsTotal)}</Text>
                </View>

                {visibleAddOns.length === 0 && visibleLocked.length === 0 ? (
                  <Text className="text-gray-500 text-center py-6">No add-on features match your search.</Text>
                ) : null}

                {visibleAddOns.map((f) => (
                  <AddOnCard
                    key={f.id}
                    feature={f}
                    price={priceForFeature(f, projectType, false)}
                    selected={config.featureIds.includes(f.id)}
                    onToggle={() => toggleFeature(f.id, allFeatures)}
                    requires={requiresFor(f)}
                  />
                ))}

                {visibleLocked.map((f) => (
                  <AddOnCard
                    key={f.id}
                    feature={f}
                    price={priceForFeature(f, projectType, false)}
                    selected={false}
                    onToggle={() => undefined}
                    locked={{ includedInAdvanced: isFeatureIncluded(f, projectType, "advanced") }}
                    onSwitchLevel={() => navigation.popTo("BuilderLevel")}
                  />
                ))}
              </>
            )}
          </View>
        </>
      )}
    </WizardScreen>
  );
}

export default BuilderFeaturesScreen;
