import React from "react";
import { View, Text, Pressable, Linking, Share } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui";
import { currentAppVersion } from "@/lib/appVersion";


const LINKS = [
  { icon: "document-text-outline" as const, label: "Terms & Conditions", onPress: (nav: any) => nav.getParent()?.navigate("SettingsModule", { screen: "Terms" }) },
  { icon: "shield-checkmark-outline" as const, label: "Privacy Policy", onPress: (nav: any) => nav.getParent()?.navigate("SettingsModule", { screen: "Privacy" }) },
  {
    icon: "star-outline" as const,
    label: "Rate Us",
    onPress: () => Linking.openURL("https://play.google.com/store/apps"),
  },
  {
    icon: "share-social-outline" as const,
    label: "Share App",
    onPress: () => Share.share({ message: "Check out CampusEduX — projects, jobs, and placement prep in one app! https://campusedux.app" }),
  },
];

export function AboutScreen() {
  const navigation = useNavigation();

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-6">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">About App</Text>
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

      {LINKS.map((link) => (
        <Pressable
          key={link.label}
          onPress={() => link.onPress(navigation)}
          className="flex-row items-center justify-between py-3.5 border-b border-gray-100"
        >
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
