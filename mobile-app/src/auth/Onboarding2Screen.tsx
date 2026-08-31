import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingSlide } from "@/components/ui/OnboardingSlide";
import type { AuthStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Onboarding2">;

export function Onboarding2Screen() {
  const navigation = useNavigation<Nav>();
  return (
    <OnboardingSlide
      icon="briefcase-outline"
      title="Find the Right Jobs"
      subtitle="Apply to the best jobs and kickstart your career"
      activeDotIndex={1}
      ctaLabel="Next"
      onSkip={() => (navigation as any).navigate("Login")}
      onNext={() => (navigation as any).navigate("Onboarding3")}
    />
  );
}

export default Onboarding2Screen;
