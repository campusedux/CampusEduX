import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { usePremiumFeatures } from "@/hooks/usePremium";
import type { PremiumStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<PremiumStackParamList, "PremiumFeatures">;

export function PremiumFeaturesScreen() {
  const navigation = useNavigation<Nav>();
  const { data: features, isLoading, isError, refetch } = usePremiumFeatures();

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Premium Features</Text>
      </View>

      <View className="rounded-2xl p-5 mb-6" style={{ backgroundColor: "#4F39F6" }}>
        <View className="flex-row items-center mb-1">
          <Ionicons name="diamond" size={20} color="#FBBF24" />
          <Text className="text-white font-bold text-base ml-2">All Premium Features</Text>
        </View>
        <Text className="text-indigo-100 text-sm">Everything you need to crack your dream job!</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading features..." />
      ) : isError || !features ? (
        <ErrorState message="Couldn't load features." onRetry={refetch} />
      ) : (
        features.map((feature) => (
          <View key={feature.id} className="flex-row items-center border border-gray-100 rounded-2xl p-4 mb-3">
            <View className="w-11 h-11 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
              <Ionicons name={feature.icon as any} size={20} color="#4F39F6" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">{feature.title}</Text>
              <Text className="text-gray-400 text-sm mt-0.5">{feature.subtitle}</Text>
            </View>
          </View>
        ))
      )}

      <Button label="Choose Your Plan" onPress={() => (navigation as any).navigate("PremiumPlans")} className="mt-2 mb-6" />
    </Screen>
  );
}

export default PremiumFeaturesScreen;
