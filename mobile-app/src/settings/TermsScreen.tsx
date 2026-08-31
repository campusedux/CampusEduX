import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button } from "@/components/ui";
import { LegalDocumentBody } from "@/legal";
import { useSettingsStore } from "@/store/settingsStore";
import { useUpdatePreferences } from "@/hooks/useSettings";

export function TermsScreen() {
  const navigation = useNavigation<any>();
  const hasAgreed = useSettingsStore((s) => s.preferences.hasAgreedToTerms);
  const updatePreferences = useUpdatePreferences();

  const handleAgree = () => {
    updatePreferences({ hasAgreedToTerms: true });
    notify("Thank you", "You've agreed to the Terms & Conditions.");
  };

  return (
    <Screen>
      <View className="flex-row items-center mt-2 mb-3 px-6">
        <Pressable onPress={() => navigation.goBack()} className="mr-3" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Terms & Conditions</Text>
      </View>

      <ScrollView className="px-6" contentContainerStyle={{ paddingBottom: 16 }}>
        <LegalDocumentBody
          docId="terms"
          onNavigateRelated={(id) =>
            id === "contact"
              ? navigation.navigate("Contact")
              : navigation.navigate("LegalDocument", { docId: id })
          }
        />
      </ScrollView>

      <View className="px-6 py-4 border-t border-gray-100">
        <Button label={hasAgreed ? "Agreed ✓" : "I Agree"} disabled={hasAgreed} onPress={handleAgree} />
      </View>
    </Screen>
  );
}

export default TermsScreen;
