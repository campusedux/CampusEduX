import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui";
import type { HomeStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<HomeStackParamList, "PlacementBanner">;

const PREP_LINKS = [
  { label: "Aptitude", subtitle: "Quant, Reasoning, Verbal", count: "120+ Tests", icon: "calculator-outline" },
  { label: "DSA Practice", subtitle: "500+ Coding Questions", count: "500+ Qs", icon: "code-slash-outline" },
  { label: "HR Interview", subtitle: "Top HR Questions", count: "200+ Qs", icon: "people-outline" },
  { label: "Mock Tests", subtitle: "Company Wise Tests", count: "50+ Tests", icon: "document-text-outline" },
  { label: "Resume Builder", subtitle: "Create ATS Friendly Resume", count: "", icon: "create-outline" },
] as const;

/**
 * Home module's "Placement Preparation" quick-access screen. Routes into the
 * Prep tab; the full 24-screen Placement module ships in its own phase.
 */
export function PlacementBannerScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">Placement Preparation</Text>
        </View>
        <Pressable onPress={() => (navigation.getParent() as any)?.navigate("Prep")}>
          <Text className="text-primary text-sm font-medium">View All</Text>
        </Pressable>
      </View>

      <View className="flex-row items-center rounded-2xl p-4 mb-5" style={{ backgroundColor: "#4F39F6" }}>
        <View className="flex-1 pr-3">
          <Text className="text-white font-bold text-base mb-1">Get Placement Ready</Text>
          <Text className="text-white/80 text-xs">Practice DSA, Aptitude, HR &amp; Company Tests</Text>
        </View>
        <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.18)" }}>
          <Ionicons name="disc-outline" size={24} color="#FFFFFF" />
        </View>
      </View>

      {PREP_LINKS.map((link) => (
        <Pressable
          key={link.label}
          onPress={() => (navigation.getParent() as any)?.navigate("Prep")}
          className="flex-row items-center bg-white rounded-2xl border border-gray-100 p-4 mb-3"
        >
          <View className="w-11 h-11 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
            <Ionicons name={link.icon as any} size={20} color="#4F39F6" />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-gray-900">{link.label}</Text>
            <Text className="text-gray-400 text-sm">{link.subtitle}</Text>
          </View>
          {link.count ? (
            <Text className="text-primary text-xs font-semibold mr-2">{link.count}</Text>
          ) : null}
          <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        </Pressable>
      ))}
    </Screen>
  );
}

export default PlacementBannerScreen;
