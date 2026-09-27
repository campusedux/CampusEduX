import React from "react";
import { View, Text, Pressable, Linking, Share } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { STORE_URL } from "@/constants/contact";
import { Screen } from "@/components/ui";
import { currentAppVersion } from "@/lib/appVersion";
import type { SettingsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<SettingsStackParamList, "About">;


export function AboutScreen() {
  const navigation = useNavigation<Nav>();

  const links = [
    {
      icon: "sparkles-outline" as const,
      label: "What's New",
      onPress: () =>
        notify(
          "What's New in v1.0.0",
          "• Projects, Jobs, and Placement Prep in one app\n• Resume Builder with ATS scoring\n• Referral rewards & Premium plans"
        ),
    },
    ...(STORE_URL
      ? [{ icon: "star-outline" as const, label: "Rate Us", onPress: () => Linking.openURL(STORE_URL).catch(() => notify("Couldn't open the store", "Please try again later.")) }]
      : []),
    {
      icon: "share-social-outline" as const,
      label: "Share App",
      onPress: () => Share.share({ message: "Check out CampusEduX — projects, jobs, and placement prep in one app! https://campusedux.app" }),
    },
  ];

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-6">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">About</Text>
      </View>

      <View className="items-center mb-8">
        <View className="w-20 h-20 rounded-2xl items-center justify-center mb-3" style={{ backgroundColor: "#4F39F6" }}>
          <Ionicons name="school" size={36} color="#FBBF24" />
        </View>
        <Text className="text-xl font-bold text-gray-900">CampusEduX</Text>
        <Text className="text-gray-400 text-sm mt-1">Version {currentAppVersion() ?? "—"}</Text>
        <Text className="text-gray-500 text-sm text-center mt-3 px-6">
          Your all-in-one platform for projects, jobs, placement preparation and more.
        </Text>
      </View>

      {links.map((link) => (
        <Pressable key={link.label} onPress={link.onPress} className="flex-row items-center justify-between py-3.5 border-b border-gray-100">
          <View className="flex-row items-center">
            <Ionicons name={link.icon} size={20} color="#4F39F6" />
            <Text className="text-gray-900 ml-3">{link.label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
        </Pressable>
      ))}

      <Text className="text-gray-400 text-xs text-center mt-8">© 2026 CampusEduX. All rights reserved.</Text>
    </Screen>
  );
}

export default AboutScreen;
