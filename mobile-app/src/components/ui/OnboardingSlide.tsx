import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "./Button";

interface OnboardingSlideProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  activeDotIndex: 0 | 1 | 2;
  ctaLabel: string;
  onSkip?: () => void;
  onNext: () => void;
}

/**
 * Shared layout for the 3 onboarding slides (Module 1, screen 2).
 * Only icon / copy / CTA differ between slides; Skip is hidden on the last one.
 */
export function OnboardingSlide({
  icon,
  title,
  subtitle,
  activeDotIndex,
  ctaLabel,
  onSkip,
  onNext,
}: OnboardingSlideProps) {
  return (
    <View className="flex-1 bg-white px-6 pt-4">
      <View className="h-10 items-end justify-center">
        {onSkip ? (
          <Pressable onPress={onSkip} hitSlop={12}>
            <Text className="text-gray-500 text-[15px]">Skip</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="flex-1 items-center justify-center">
        <View className="w-64 h-64 items-center justify-center mb-12">
          {/* Soft blob behind the illustration */}
          <View
            className="absolute w-64 h-64"
            style={{ backgroundColor: "#EEF0FF", borderRadius: 120, transform: [{ rotate: "20deg" }] }}
          />
          <View
            className="w-32 h-32 rounded-full items-center justify-center"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <Ionicons name={icon} size={72} color="#4F39F6" />
          </View>
        </View>

        <Text className="text-[22px] font-bold text-gray-900 text-center mb-3">{title}</Text>
        <Text className="text-[15px] leading-5 text-gray-500 text-center px-6">{subtitle}</Text>
      </View>

      <View className="flex-row justify-center mb-8">
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            className="h-2 rounded-full mx-1"
            style={{
              width: i === activeDotIndex ? 24 : 8,
              backgroundColor: i === activeDotIndex ? "#4F39F6" : "#DDE1FF",
            }}
          />
        ))}
      </View>

      <Button label={ctaLabel} onPress={onNext} className="mb-6" />
    </View>
  );
}

export default OnboardingSlide;
