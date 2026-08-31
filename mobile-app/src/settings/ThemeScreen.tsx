import React from "react";
import { View, Text, Pressable, Switch } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui";
import { useSettingsStore, ACCENT_COLORS } from "@/store/settingsStore";
import { useUpdatePreferences } from "@/hooks/useSettings";
import type { AppTheme } from "@/types";

const THEME_OPTIONS: { key: AppTheme; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "light", label: "Light", icon: "sunny-outline" },
  { key: "dark", label: "Dark", icon: "moon-outline" },
  { key: "system", label: "System", icon: "phone-portrait-outline" },
];

export function ThemeScreen() {
  const navigation = useNavigation();
  const preferences = useSettingsStore((s) => s.preferences);
  const updatePreferences = useUpdatePreferences();

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Theme</Text>
      </View>

      <Text className="text-gray-400 text-sm mb-3">Appearance</Text>
      <View className="flex-row mb-6" style={{ gap: 10 }}>
        {THEME_OPTIONS.map((option) => {
          const isActive = preferences.theme === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => updatePreferences({ theme: option.key })}
              className="flex-1 items-center border rounded-2xl py-4"
              style={{ borderColor: isActive ? "#4F39F6" : "#E5E7EB", borderWidth: isActive ? 2 : 1, backgroundColor: isActive ? "#EEF0FF" : "#fff" }}
            >
              <Ionicons name={option.icon} size={22} color={isActive ? "#4F39F6" : "#6B7280"} />
              <Text className={`text-sm mt-2 ${isActive ? "text-primary font-semibold" : "text-gray-600"}`}>{option.label}</Text>
              {isActive && <Ionicons name="checkmark-circle" size={16} color="#4F39F6" style={{ marginTop: 4 }} />}
            </Pressable>
          );
        })}
      </View>

      <Text className="text-gray-400 text-sm mb-3">Accent Color</Text>
      <View className="flex-row mb-6" style={{ gap: 12 }}>
        {ACCENT_COLORS.map((color) => {
          const isActive = preferences.accentColor === color;
          return (
            <Pressable
              key={color}
              onPress={() => updatePreferences({ accentColor: color })}
              className="items-center justify-center rounded-full"
              style={{ width: 36, height: 36, backgroundColor: color, borderWidth: isActive ? 3 : 0, borderColor: "#111827" }}
            >
              {isActive && <Ionicons name="checkmark" size={16} color="#fff" />}
            </Pressable>
          );
        })}
      </View>

      <Text className="text-gray-400 text-sm mb-3">More Options</Text>
      <View className="flex-row items-center justify-between py-3.5 border-b border-gray-100">
        <View className="flex-1 mr-3">
          <Text className="text-gray-900">Use AMOLED Dark Mode</Text>
          <Text className="text-gray-400 text-xs mt-0.5">Save battery on AMOLED screens</Text>
        </View>
        <Switch
          value={preferences.useAmoledDark}
          onValueChange={(value) => updatePreferences({ useAmoledDark: value })}
          trackColor={{ true: "#4F39F6" }}
          disabled={preferences.theme === "light"}
        />
      </View>
      <View className="flex-row items-center justify-between py-3.5 border-b border-gray-100">
        <View className="flex-1 mr-3">
          <Text className="text-gray-900">Reduce Animations</Text>
          <Text className="text-gray-400 text-xs mt-0.5">Minimize motion effects</Text>
        </View>
        <Switch
          value={preferences.reduceAnimations}
          onValueChange={(value) => updatePreferences({ reduceAnimations: value })}
          trackColor={{ true: "#4F39F6" }}
        />
      </View>
    </Screen>
  );
}

export default ThemeScreen;
