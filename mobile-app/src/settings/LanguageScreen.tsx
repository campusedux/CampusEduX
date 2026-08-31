import React from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui";
import { useSettingsStore } from "@/store/settingsStore";
import { useUpdatePreferences } from "@/hooks/useSettings";
import type { AppLanguage } from "@/types";

const LANGUAGES: AppLanguage[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
];

export function LanguageScreen() {
  const navigation = useNavigation();
  const preferences = useSettingsStore((s) => s.preferences);
  const updatePreferences = useUpdatePreferences();

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Language</Text>
      </View>

      <Text className="text-gray-400 text-sm mb-3">Select Language</Text>
      <FlatList
        data={LANGUAGES}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => {
          const isActive = preferences.languageCode === item.code;
          return (
            <Pressable
              onPress={() => updatePreferences({ languageCode: item.code })}
              className="flex-row items-center justify-between py-4 border-b border-gray-100"
            >
              <View>
                <Text className={isActive ? "text-primary font-semibold text-base" : "text-gray-900 text-base"}>{item.nativeName}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">{item.name}</Text>
              </View>
              <Ionicons name={isActive ? "radio-button-on" : "radio-button-off"} size={22} color={isActive ? "#4F39F6" : "#D1D5DB"} />
            </Pressable>
          );
        }}
      />

      <Text className="text-gray-400 text-xs text-center mt-4">
        Note: full in-app translation is limited in this build — this preference is saved and syncs across devices.
      </Text>
    </Screen>
  );
}

export default LanguageScreen;
