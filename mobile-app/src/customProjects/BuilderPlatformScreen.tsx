import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LoadingState, ErrorState } from "@/components/ui";
import { useCustomPricing } from "@/hooks/useCustomProjects";
import { useBuilderStore } from "./builderStore";
import { WizardScreen, OptionRow, rupees } from "./components/wizard";
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

  if (isLoading) return <LoadingState label="Loading platforms…" />;
  if (isError || !data) return <ErrorState message="Couldn't load platforms." onRetry={refetch} />;

  return (
    <WizardScreen
      step={3}
      title="Which platforms?"
      subtitle="Platform charges are added to the estimated project price."
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("BuilderDetails")}
      nextDisabled={!platform}
    >
      {data.platformPricing.map((p) => (
        <OptionRow
          key={p.platform}
          icon={PLATFORM_ICON[p.platform]}
          title={p.label}
          meta={p.charge > 0 ? `+ ${rupees(p.charge)}` : "Included"}
          selected={platform === p.platform}
          onPress={() => setPlatform(p.platform)}
        />
      ))}
    </WizardScreen>
  );
}

export default BuilderPlatformScreen;
