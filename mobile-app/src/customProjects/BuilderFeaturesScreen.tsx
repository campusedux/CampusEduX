import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LoadingState, ErrorState } from "@/components/ui";
import { useCustomFeatures, useCustomPricing } from "@/hooks/useCustomProjects";
import { estimatePrice, getFeaturesFor, priceForFeature } from "@/services/customProjects.service";
import { useBuilderStore } from "./builderStore";
import { WizardScreen, rupees } from "./components/wizard";
import type { CustomFeature, CustomProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "BuilderFeatures">;

export function BuilderFeaturesScreen() {
  const navigation = useNavigation<Nav>();
  const featuresQ = useCustomFeatures();
  const pricingQ = useCustomPricing();
  const config = useBuilderStore((s) => s.config);
  const toggleFeature = useBuilderStore((s) => s.toggleFeature);
  const pruneFeatures = useBuilderStore((s) => s.pruneFeatures);

  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(rawSearch.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [rawSearch]);

  const available = useMemo(
    () => getFeaturesFor(config.projectType, config.projectLevel, featuresQ.data ?? []),
    [config.projectType, config.projectLevel, featuresQ.data]
  );

  // Drop any previously-picked feature that isn't valid for the current tier (§37 safe).
  useEffect(() => {
    if (available.length) pruneFeatures(available.map((f) => f.id));
  }, [available, pruneFeatures]);

  const nameById = useMemo(
    () => new Map((featuresQ.data ?? []).map((f) => [f.id, f.name])),
    [featuresQ.data]
  );

  const grouped = useMemo(() => {
    const q = search;
    const rows = q
      ? available.filter(
          (f) => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
        )
      : available;
    const map = new Map<string, CustomFeature[]>();
    for (const f of rows) {
      const list = map.get(f.category) ?? [];
      list.push(f);
      map.set(f.category, list);
    }
    return [...map.entries()];
  }, [available, search]);

  const estimate = useMemo(
    () =>
      estimatePrice(
        config,
        pricingQ.data?.pricing ?? [],
        pricingQ.data?.platformPricing ?? [],
        featuresQ.data ?? []
      ),
    [config, pricingQ.data, featuresQ.data]
  );

  if (featuresQ.isLoading || pricingQ.isLoading) return <LoadingState label="Loading features…" />;
  if (featuresQ.isError || pricingQ.isError) {
    return <ErrorState message="Couldn't load the feature catalog." onRetry={featuresQ.refetch} />;
  }

  return (
    <WizardScreen
      step={5}
      title="Select features"
      subtitle="Only features suited to your project type and level are shown."
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("BuilderUploads")}
      footerExtra={
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-gray-500">
            {config.featureIds.length} selected
          </Text>
          <Text className="text-gray-900 font-semibold">Estimate {rupees(estimate.estimatedTotal)}</Text>
        </View>
      }
    >
      <View className="flex-row items-center rounded-xl border border-gray-200 bg-white px-3 mb-4" style={{ height: 46 }}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          value={rawSearch}
          onChangeText={setRawSearch}
          placeholder="Search features"
          placeholderTextColor="#9CA3AF"
          className="flex-1 ml-2 text-base text-gray-900"
        />
      </View>

      {grouped.length === 0 ? (
        <Text className="text-gray-400 text-center py-8">No features match “{rawSearch}”.</Text>
      ) : (
        grouped.map(([category, rows]) => (
          <View key={category} className="mb-4">
            <Text className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-2">{category}</Text>
            {rows.map((f) => {
              const selected = config.featureIds.includes(f.id);
              return (
                <Pressable
                  key={f.id}
                  onPress={() => toggleFeature(f.id, featuresQ.data ?? [])}
                  className="flex-row items-center rounded-xl border px-3 py-3 mb-2"
                  style={{ borderColor: selected ? "#4F39F6" : "#E5E7EB", backgroundColor: selected ? "#EEF0FF" : "#FFFFFF" }}
                >
                  <Ionicons
                    name={selected ? "checkbox" : "square-outline"}
                    size={20}
                    color={selected ? "#4F39F6" : "#D1D5DB"}
                  />
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center flex-wrap">
                      <Text className={`font-medium ${selected ? "text-primary" : "text-gray-900"}`}>{f.name}</Text>
                      {f.level && f.level !== "standard" ? (
                        <Text className="text-[10px] font-bold uppercase tracking-wide text-gray-400 ml-2">
                          {f.level}
                        </Text>
                      ) : null}
                    </View>
                    {f.description ? (
                      <Text className="text-gray-400 text-xs mt-0.5">{f.description}</Text>
                    ) : null}
                    {f.dependencies && f.dependencies.length > 0 ? (
                      <Text className="text-xs mt-1" style={{ color: "#B45309" }}>
                        Requires: {f.dependencies.map((d) => nameById.get(d) ?? d).join(", ")}
                      </Text>
                    ) : null}
                  </View>
                  <Text className="text-gray-700 text-sm font-semibold ml-2">
                    {(() => {
                      const price = priceForFeature(f, config.projectType, false);
                      return price > 0 ? `+ ${rupees(price)}` : "Free";
                    })()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))
      )}
    </WizardScreen>
  );
}

export default BuilderFeaturesScreen;
