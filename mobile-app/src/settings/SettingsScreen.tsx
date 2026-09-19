import { performLogoutCleanup } from "@/lib/logoutCleanup";
import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui";
import { confirmAction, notify } from "@/lib/notify";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { authService } from "@/services/auth.service";
import type { SettingsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<SettingsStackParamList, "Settings">;

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "हिन्दी",
  mr: "मराठी",
  gu: "ગુજરાતી",
  ta: "தமிழ்",
  te: "తెలుగు",
  bn: "বাংলা",
};

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const preferences = useSettingsStore((s) => s.preferences);

  const handleLogout = () => {
    confirmAction(
      "Logout",
      "Are you sure you want to logout?",
      async () => {
        try {
          await authService.logout();
        } catch (error: any) {
          notify("Logout failed", error?.message ?? "Please try again.");
          return;
        }
        await performLogoutCleanup(); // wipes per-user state; RootNavigator returns to the auth stack
      },
      "Logout"
    );
  };

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Settings</Text>
      </View>

      <Pressable
        onPress={() => (navigation.getParent() as any)?.navigate("MainTabs", { screen: "Profile" })}
        className="flex-row items-center border border-gray-100 rounded-2xl p-4 mb-6"
      >
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} className="w-12 h-12 rounded-full mr-3" />
        ) : (
          <View className="w-12 h-12 rounded-full items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
            <Ionicons name="person" size={22} color="#4F39F6" />
          </View>
        )}
        <View className="flex-1">
          <Text className="font-bold text-gray-900">{user?.fullName ?? "Guest"}</Text>
          <Text className="text-gray-400 text-sm">{user?.email}</Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-primary text-sm font-medium mr-1">View Profile</Text>
          <Ionicons name="chevron-forward" size={14} color="#4F39F6" />
        </View>
      </Pressable>

      <Text className="text-gray-400 text-sm mb-3">Preferences</Text>
      <Row
        icon="color-palette-outline"
        label="Theme"
        value={preferences.theme.charAt(0).toUpperCase() + preferences.theme.slice(1)}
        onPress={() => (navigation as any).navigate("Theme")}
      />
      <Row
        icon="language-outline"
        label="Language"
        value={LANGUAGE_NAMES[preferences.languageCode] ?? "English"}
        onPress={() => (navigation as any).navigate("Language")}
      />
      <Row icon="notifications-outline" label="Notification" onPress={() => (navigation as any).navigate("Notification")} />

      <Text className="text-gray-400 text-sm mb-3 mt-6">Account & Privacy</Text>
      <Row icon="shield-checkmark-outline" label="Privacy" onPress={() => (navigation as any).navigate("Privacy")} />
      <Row icon="reader-outline" label="Legal & Privacy" onPress={() => (navigation as any).navigate("LegalHub")} />
      <Row icon="document-text-outline" label="Terms & Conditions" onPress={() => (navigation as any).navigate("Terms")} />
      <Row icon="headset-outline" label="Contact Support" onPress={() => (navigation as any).navigate("ContactSupport")} />
      <Row icon="information-circle-outline" label="About App" onPress={() => (navigation as any).navigate("About")} />

      <Pressable onPress={handleLogout} className="flex-row items-center py-3.5 mt-6 mb-6">
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <Text className="text-danger ml-3 font-medium">Logout</Text>
      </Pressable>
    </Screen>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-between py-3.5 border-b border-gray-100">
      <View className="flex-row items-center">
        <Ionicons name={icon} size={20} color="#4F39F6" />
        <Text className="text-gray-900 ml-3">{label}</Text>
      </View>
      <View className="flex-row items-center">
        {value ? <Text className="text-gray-400 text-sm mr-2">{value}</Text> : null}
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      </View>
    </Pressable>
  );
}

export default SettingsScreen;
