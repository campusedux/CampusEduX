import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ui";
import { SkeletonList } from "@/components/ui/SkeletonLoader";
import { useBuilderEstimate } from "./useBuilderEstimate";
import { useBuilderStore } from "./builderStore";
import { WizardScreen, SectionCard } from "./components/wizard";
import { useGoToStep } from "./components/ProjectSummaryPanel";
import { FeatureIncludedList } from "./components/FeatureIncludedList";
import { PriceBreakdown } from "./components/PriceBreakdown";
import { NextStepsTimeline } from "./components/NextStepsTimeline";
import { TermLabel } from "./components/InfoTooltip";
import { TokenRefundSummary } from "./components/TokenRefundSummary";
import { BALANCE_TIMING_TEXT, CUSTOM_REQUIREMENTS_NOTE, LEVEL_LABEL, TERMS, TYPE_LABEL } from "./components/builderCopy";
import { rupees } from "./components/format";
import { CUSTOM_PLATFORM_LABELS, type CustomProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "BuilderEstimate">;

function EditLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      hitSlop={8}
      style={{ minHeight: 44, justifyContent: "center" }}
    >
      <Text className="text-primary text-sm font-semibold">{label.startsWith("Add") ? label : "Edit"}</Text>
    </Pressable>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View className="py-1.5">
      <Text className="text-gray-500 text-xs">{label}</Text>
      <Text className="text-gray-900 mt-0.5">{value}</Text>
    </View>
  );
}

export function BuilderEstimateScreen() {
  const navigation = useNavigation<Nav>();
  const goTo = useGoToStep();
  const { config, estimate, isLoading, isError, refetch } = useBuilderEstimate();
  const previews = useBuilderStore((s) => s.previews);
  const [agreed, setAgreed] = useState(false);
  const [showHow, setShowHow] = useState(false);

  const { projectType, projectLevel } = config;
  const levelLabel = projectLevel ? LEVEL_LABEL[projectLevel] : "";
  const hasCustomRequirements = config.customRequirements.length > 0;
  const imageUri = config.projectImagePath ? previews[config.projectImagePath] : undefined;
  const openLegal = (docId: "terms" | "refund-policy") => navigation.navigate("LegalDocument", { docId });

  const steps = [
    { title: "Pay the token", body: "Your token confirms your request and starts the work." },
    {
      title: "Our team reviews your request",
      body: "We go through your project type, features and details.",
    },
    ...(hasCustomRequirements
      ? [{ title: "Price confirmed with you", body: "If your custom requirements change the price, we confirm with you first." }]
      : []),
    ...(projectType === "academic"
      ? [{ title: "Mentoring and feedback", body: "We review your work, answer questions and give feedback through messages." }]
      : [{ title: "Development and testing", body: "We build your project and test it." },
         { title: "Delivery", body: "You receive the finished software. Track every step in My Custom Projects." }]),
  ];

  return (
    <WizardScreen
      step={7}
      title="Review your estimate"
      helper={projectType === "academic" ? "Review the mentoring scope and price. You author any assessed deliverables." : "Review the software scope and price."}
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("BuilderPayment")}
      nextLabel={`Continue to payment — ${rupees(estimate.token)}`}
      nextDisabled={!agreed || isError || isLoading}
      disabledReason={!agreed && !isLoading ? "Tick the box below to confirm you've reviewed your project." : undefined}
    >
      {isLoading ? (
        <SkeletonList count={4} />
      ) : isError ? (
        <ErrorState message="Couldn't build the estimate." onRetry={refetch} />
      ) : (
        <>
          {/* 1. Project summary */}
          <SectionCard title="Project summary" right={<EditLink label="Edit details" onPress={() => goTo("BuilderDetails")} />}>
            <SummaryRow label="Title" value={config.title.trim()} />
            <View className="flex-row items-start">
              <View className="flex-1">
                <SummaryRow label="Project type" value={projectType ? `${TYPE_LABEL[projectType]} project` : "—"} />
              </View>
              <EditLink label="Edit project type" onPress={() => goTo("BuilderType")} />
            </View>
            <View className="flex-row items-start">
              <View className="flex-1">
                <SummaryRow label="Level" value={levelLabel || "—"} />
              </View>
              <EditLink label="Edit level" onPress={() => goTo("BuilderLevel")} />
            </View>
            <View className="flex-row items-start">
              <View className="flex-1">
                <SummaryRow label="Platform" value={config.platform ? CUSTOM_PLATFORM_LABELS[config.platform] : "—"} />
              </View>
              <EditLink label="Edit platform" onPress={() => goTo("BuilderPlatform")} />
            </View>
            <SummaryRow label="Objective" value={config.objective.trim()} />
            <SummaryRow label="Target users" value={config.targetUsers.trim()} />
            <SummaryRow label="Technology preference" value={config.technologyPreference.trim()} />
            {hasCustomRequirements ? (
              <View className="py-1.5">
                <Text className="text-gray-500 text-xs">Custom requirements</Text>
                {config.customRequirements.map((r, i) => (
                  <Text key={`${r.text}-${i}`} className="text-gray-900 mt-0.5">
                    • {r.text}
                  </Text>
                ))}
              </View>
            ) : null}
          </SectionCard>

          {/* 2. Included features */}
          {projectType !== "academic" && <FeatureIncludedList features={estimate.includedFeatures} levelLabel={levelLabel} showHelper={false} />}

          {/* 3. Add-on features */}
          {projectType !== "academic" && <SectionCard
            title={<TermLabel term={TERMS.addOn} className="font-bold text-gray-900" />}
            right={<EditLink label={estimate.addOns.length ? "Edit add-ons" : "Add features"} onPress={() => goTo("BuilderFeatures")} />}
          >
            {estimate.addOns.length === 0 ? (
              <Text className="text-gray-500">No add-ons selected.</Text>
            ) : (
              estimate.addOns.map((f) => (
                <View key={f.id} className="flex-row justify-between py-1.5">
                  <Text className="text-gray-800 flex-1 pr-3">{f.name}</Text>
                  <Text className="text-gray-900 font-medium">{f.price > 0 ? `+${rupees(f.price)}` : "Free"}</Text>
                </View>
              ))
            )}
          </SectionCard>}

          {/* 4. Uploads */}
          <SectionCard title="Uploads" right={<EditLink label="Edit uploads" onPress={() => goTo("BuilderUploads")} />}>
            <View className="flex-row items-center">
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={{ width: 64, height: 40, borderRadius: 8 }} contentFit="cover" accessibilityLabel="Project image" />
              ) : (
                <View className="items-center justify-center bg-gray-50 rounded-lg" style={{ width: 64, height: 40 }}>
                  <Ionicons name={config.projectImagePath ? "image" : "image-outline"} size={18} color="#9CA3AF" />
                </View>
              )}
              <View className="ml-3 flex-1">
                <Text className="text-gray-800">{config.projectImagePath ? "Project image attached" : "No project image"}</Text>
                <Text className="text-gray-500 text-sm">
                  {config.referenceFiles.length} reference file{config.referenceFiles.length === 1 ? "" : "s"}
                </Text>
              </View>
            </View>
          </SectionCard>

          {/* 5. Price breakdown + 6. How it is calculated */}
          <PriceBreakdown estimate={estimate} levelLabel={levelLabel} />
          <Pressable
            onPress={() => setShowHow((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showHow }}
            className="flex-row items-center rounded-xl px-3 mb-4"
            style={{ minHeight: 44, backgroundColor: "#EEF0FF" }}
          >
            <Ionicons name="calculator-outline" size={18} color="#4F39F6" />
            <Text className="text-primary font-semibold ml-2 flex-1">How was this calculated?</Text>
            <Ionicons name={showHow ? "chevron-up" : "chevron-down"} size={18} color="#4F39F6" />
          </Pressable>
          {showHow ? (
            <View className="rounded-xl border border-gray-100 bg-white p-4 mb-4">
              <Text className="text-gray-700 mb-1.5">• The base price depends on your project type and level ({levelLabel}).</Text>
              <Text className="text-gray-700 mb-1.5">• Included features are free — they are already covered by the base price.</Text>
              <Text className="text-gray-700 mb-1.5">• Each add-on you choose adds its listed price.</Text>
              <Text className="text-gray-700">• Platform charges depend on where your project runs (Web has none).</Text>
            </View>
          ) : null}

          {/* 7. Payment plan */}
          <SectionCard title="Payment plan">
            <View className="flex-row items-center justify-between py-1.5">
              <TermLabel term={TERMS.token} className="text-gray-900 font-semibold" />
              <Text className="text-primary font-bold text-xl">{rupees(estimate.token)}</Text>
            </View>
            <Text className="text-gray-500 text-xs mb-2">Pay now — your token confirms your request and starts the work.</Text>
            <View className="border-t border-gray-100 pt-2 flex-row items-center justify-between py-1.5">
              <TermLabel term={TERMS.balance} className="text-gray-900 font-semibold" />
              <Text className="text-gray-900 font-bold text-lg">{rupees(estimate.balanceAfterToken)}</Text>
            </View>
            <Text className="text-gray-500 text-xs">{BALANCE_TIMING_TEXT}</Text>
            <TokenRefundSummary onReadFullPolicy={() => openLegal("refund-policy")} />
          </SectionCard>

          {/* 8. What happens next */}
          <SectionCard title="What happens next">
            <NextStepsTimeline steps={steps} />
          </SectionCard>

          {/* 9. Estimate note — only when custom requirements were entered */}
          {hasCustomRequirements ? (
            <View className="flex-row rounded-xl px-3 py-3 mb-4" style={{ backgroundColor: "#FFFBEB" }}>
              <Ionicons name="alert-circle-outline" size={18} color="#B45309" />
              <Text className="text-sm ml-2 flex-1" style={{ color: "#92400E" }}>
                {CUSTOM_REQUIREMENTS_NOTE}
              </Text>
            </View>
          ) : null}

          {/* 10. Acknowledgement */}
          <Pressable
            onPress={() => setAgreed((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            accessibilityLabel="I have reviewed my project and agree to the Terms and Refund Policy"
            className="flex-row items-start mb-2"
            style={{ minHeight: 44 }}
          >
            <Ionicons name={agreed ? "checkbox" : "square-outline"} size={24} color={agreed ? "#4F39F6" : "#9CA3AF"} />
            <Text className="text-gray-700 flex-1 ml-2.5">
              I have reviewed my project and estimate, and I agree to the{" "}
              <Text className="text-primary font-semibold" onPress={() => openLegal("terms")}>
                Terms &amp; Conditions
              </Text>{" "}
              and{" "}
              <Text className="text-primary font-semibold" onPress={() => openLegal("refund-policy")}>
                Refund Policy
              </Text>
              .
            </Text>
          </Pressable>
        </>
      )}
    </WizardScreen>
  );
}

export default BuilderEstimateScreen;
