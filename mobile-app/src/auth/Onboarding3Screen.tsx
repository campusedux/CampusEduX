import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingSlide } from "@/components/ui/OnboardingSlide";
import { secureStorage, STORAGE_KEYS } from "@/lib/storage";
import { useAuthStore } from "@/store/authStore";
import type { AuthStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Onboarding3">;

export function Onboarding3Screen() {
  const navigation = useNavigation<Nav>();
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);

  const finishOnboarding = async () => {
    await secureStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, "true");
    setOnboardingComplete(true);
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    <OnboardingSlide
      icon="trophy-outline"
      title="Placement Ready"
      subtitle="Prepare with tests, questions and resume builder"
      activeDotIndex={2}
      ctaLabel="Get Started"
      onNext={finishOnboarding}
    />
  );
}

export default Onboarding3Screen;
