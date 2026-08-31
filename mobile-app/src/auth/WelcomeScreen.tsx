import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button } from "@/components/ui";
import { useAuthStore } from "@/store/authStore";
import type { ProfileSetupStackParamList } from "@/types";

type Rte = RouteProp<ProfileSetupStackParamList, "Welcome">;

/**
 * "Setup complete" screen. Academic details are already saved to Supabase by
 * this point; committing the year to the auth store here flips
 * hasCompletedProfileSetup, and RootNavigator swaps to the main app — no
 * imperative navigation reset needed.
 */
export function WelcomeScreen() {
  const { params } = useRoute<Rte>();
  const updateUserFields = useAuthStore((s) => s.updateUserFields);

  const goToHome = () => {
    updateUserFields({ year: params.year });
  };

  return (
    <Screen className="px-6 items-center justify-center">
      <View
        className="w-44 h-44 rounded-full items-center justify-center mb-8"
        style={{ backgroundColor: "#EEF0FF" }}
      >
        <Text style={{ fontSize: 72 }}>🎉</Text>
        <View
          className="absolute bottom-3 right-3 w-12 h-12 rounded-full items-center justify-center border-4 border-white"
          style={{ backgroundColor: "#16A34A" }}
        >
          <Ionicons name="checkmark" size={24} color="#FFFFFF" />
        </View>
      </View>

      <Text className="text-[22px] font-bold text-gray-900 mb-2 text-center">You&apos;re All Set! 🎉</Text>
      <Text className="text-[15px] leading-5 text-gray-500 text-center mb-10">
        Your profile is ready. Let&apos;s explore and build your successful career together.
      </Text>

      <Button label="Go to Home" onPress={goToHome} className="w-full mb-4" />
      <Pressable onPress={goToHome} hitSlop={8}>
        <Text className="text-primary font-semibold">Explore Features</Text>
      </Pressable>
    </Screen>
  );
}

export default WelcomeScreen;
