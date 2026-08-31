import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingSlide } from "@/components/ui/OnboardingSlide";
import type { AuthStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Onboarding1">;

export function Onboarding1Screen() {
  const navigation = useNavigation<Nav>();
  return (
    <OnboardingSlide
      icon="code-slash-outline"
      title="1000+ Projects"
      subtitle="Industry level projects to boost your skills"
      activeDotIndex={0}
      ctaLabel="Next"
      onSkip={() => (navigation as any).navigate("Login")}
      onNext={() => (navigation as any).navigate("Onboarding2")}
    />
  );
}

export default Onboarding1Screen;
