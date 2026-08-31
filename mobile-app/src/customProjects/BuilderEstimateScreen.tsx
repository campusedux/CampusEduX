import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LoadingState, ErrorState } from "@/components/ui";
import { useCustomFeatures, useCustomPricing } from "@/hooks/useCustomProjects";
import { estimatePrice } from "@/services/customProjects.service";
import { useBuilderStore } from "./builderStore";
import { WizardScreen, rupees } from "./components/wizard";
import {
  CUSTOM_PLATFORM_LABELS,
  type CustomProjectsStackParamList,
} from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "BuilderEstimate">;

const cap = (s: string | null) => (s ? s[0].toUpperCase() + s.slice(1) : "—");

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className="text-gray-500">{label}</Text>
      <Text className="text-gray-900 font-medium">{value}</Text>
    </View>
  );
}

export function BuilderEstimateScreen() {
  const navigation = useNavigation<Nav>();
  const featuresQ = useCustomFeatures();
  const pricingQ = useCustomPricing();
  const config = useBuilderStore((s) => s.config);

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

  if (featuresQ.isLoading || pricingQ.isLoading) return <LoadingState label="Building your estimate…" />;
  if (featuresQ.isError || pricingQ.isError) {
    return <ErrorState message="Couldn't build the estimate." onRetry={pricingQ.refetch} />;
  }

  return (
    <WizardScreen
      step={7}
      title="Project estimate"
      subtitle="The project price below is an estimate. The token is the initial payment to submit and start the request."
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("BuilderPayment")}
      nextLabel="Continue to payment"
    >
      <View className="rounded-2xl border border-gray-100 p-4 mb-4">
        <Text className="font-bold text-gray-900 mb-1">Project summary</Text>
        <SummaryRow label="Project" value={config.title || "Untitled"} />
        <SummaryRow label="Type" value={cap(config.projectType)} />
        <SummaryRow label="Level" value={cap(config.projectLevel)} />
        <SummaryRow
          label="Platform"
          value={config.platform ? CUSTOM_PLATFORM_LABELS[config.platform] : "—"}
        />
        {config.technologyPreference ? (
          <SummaryRow label="Technology" value={config.technologyPreference} />
        ) : null}
        <SummaryRow label="Custom requirements" value={String(config.customRequirements.length)} />
        <SummaryRow label="Reference files" value={String(config.referenceFiles.length)} />
      </View>

      <Text className="font-bold text-gray-900 mb-2">Selected features</Text>
      {estimate.selectedFeatures.length === 0 ? (
        <Text className="text-gray-400 mb-3">No optional features selected.</Text>
      ) : (
        <View className="rounded-2xl border border-gray-100 p-4 mb-4">
          {estimate.selectedFeatures.map((f) => (
            <View key={f.id} className="flex-row justify-between py-1.5">
              <Text className="text-gray-600 flex-1 pr-3">{f.name}</Text>
              <Text className="text-gray-900">{f.price > 0 ? rupees(f.price) : "Free"}</Text>
            </View>
          ))}
        </View>
      )}

      <View className="rounded-2xl border border-gray-100 p-4 mb-4">
        <View className="flex-row justify-between py-1">
          <Text className="text-gray-500">Base price</Text>
          <Text className="text-gray-900">{rupees(estimate.basePrice)}</Text>
        </View>
        <View className="flex-row justify-between py-1">
          <Text className="text-gray-500">Features</Text>
          <Text className="text-gray-900">{rupees(estimate.featureTotal)}</Text>
        </View>
        <View className="flex-row justify-between py-1">
          <Text className="text-gray-500">Platform charges</Text>
          <Text className="text-gray-900">{rupees(estimate.platformCharge)}</Text>
        </View>
        <View className="flex-row justify-between border-t border-gray-100 pt-2 mt-1">
          <Text className="font-bold text-gray-900">Estimated Project Price</Text>
          <Text className="font-bold text-gray-900 text-lg">{rupees(estimate.estimatedTotal)}</Text>
        </View>
      </View>

      <View className="rounded-2xl p-4" style={{ backgroundColor: "#EEF0FF" }}>
        <Text className="text-primary font-semibold">Initial Token Amount</Text>
        <Text className="text-primary text-2xl font-bold mt-1">{rupees(estimate.tokenAmount)}</Text>
        <Text className="text-primary/80 text-xs mt-1">
          Fixed for {cap(config.projectType)} projects — not affected by level or features.
        </Text>
      </View>
    </WizardScreen>
  );
}

export default BuilderEstimateScreen;
