import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { View, Text } from "react-native";
import { ErrorState } from "@/components/ui";
import { SkeletonList } from "@/components/ui/SkeletonLoader";
import { useCustomPricing } from "@/hooks/useCustomProjects";
import { useBuilderStore } from "./builderStore";
import { WizardScreen, OptionRow } from "./components/wizard";
import { InfoTooltip } from "./components/InfoTooltip";
import { TERMS } from "./components/builderCopy";
import { rupees } from "./components/format";
import type { CustomPlatform, CustomProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "BuilderPlatform">;

const PLATFORM_ICON: Record<CustomPlatform, keyof typeof Ionicons.glyphMap> = {
  web: "globe-outline",
  android: "logo-android",
  ios: "logo-apple",
  web_android: "phone-portrait-outline",
  web_android_ios: "layers-outline",
};

export function BuilderPlatformScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useCustomPricing();
  const platform = useBuilderStore((s) => s.config.platform);
  const setPlatform = useBuilderStore((s) => s.setPlatform);

  return (
    <WizardScreen
      step={3}
      title="Where should it run?"
      helper="Pick the platforms your project must work on — it decides the build and any extra charge."
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("BuilderDetails")}
      nextLabel="Continue to project details"
      nextDisabled={!platform}
      disabledReason="Choose a platform to continue."
    >
      <View className="flex-row items-center mb-3">
        <Text className="text-gray-700 font-semibold">{TERMS.platform.label}</Text>
        <InfoTooltip label={TERMS.platform.label} text={TERMS.platform.text} />
      </View>
      {isLoading ? (
        <SkeletonList count={5} />
      ) : isError || !data ? (
        <ErrorState message="Couldn't load platforms." onRetry={refetch} />
      ) : (
        data.platformPricing.map((p) => (
          <OptionRow
            key={p.platform}
            icon={PLATFORM_ICON[p.platform]}
            title={p.label}
            meta={p.charge > 0 ? `+${rupees(p.charge)}` : rupees(0)}
            subtitle={p.charge > 0 ? "Added to your estimate as platform charges" : "No extra charge"}
            selected={platform === p.platform}
            onPress={() => setPlatform(p.platform)}
          />
        ))
      )}
    </WizardScreen>
  );
}

export default BuilderPlatformScreen;
