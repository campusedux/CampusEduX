import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui";
import { LEGAL, LEGAL_HUB_ORDER, CURRENT_LEGAL_VERSION } from "@/constants/legal";
import type { LegalDocId } from "@/types";
import { LEGAL_DOCUMENTS } from "./content";
import { fillTokens } from "./interpolate";

const ICONS: Record<LegalDocId, keyof typeof Ionicons.glyphMap> = {
  "privacy-policy": "shield-checkmark-outline",
  terms: "document-text-outline",
  "refund-policy": "cash-outline",
  "project-license": "ribbon-outline",
  "community-guidelines": "people-outline",
  disclaimer: "alert-circle-outline",
  "data-and-permissions": "key-outline",
  "delete-account": "trash-outline",
  contact: "mail-outline",
};

export function LegalHubScreen() {
  const navigation = useNavigation<any>();

  const open = (id: LegalDocId) => {
    if (id === "contact") navigation.navigate("Contact");
    else if (id === "delete-account") navigation.navigate("DeleteAccount");
    else navigation.navigate("LegalDocument", { docId: id });
  };

  return (
    <Screen scroll className="px-6 pb-8">
      <View className="flex-row items-center mt-2 mb-1">
        <Pressable onPress={() => navigation.goBack()} className="mr-3" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Legal & Privacy</Text>
      </View>
      <Text className="text-gray-400 text-xs mb-5 ml-9">
        {LEGAL.appName} · policies v{CURRENT_LEGAL_VERSION}
      </Text>

      {LEGAL_HUB_ORDER.map((id) => {
        const doc = LEGAL_DOCUMENTS[id];
        const danger = id === "delete-account";
        return (
          <Pressable
            key={id}
            onPress={() => open(id)}
            className="flex-row items-center py-3.5 border-b border-gray-100"
          >
            <View
              className="w-9 h-9 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: danger ? "#FEECEC" : "#EEF0FF" }}
            >
              <Ionicons name={ICONS[id]} size={18} color={danger ? "#DC2626" : "#4F39F6"} />
            </View>
            <View className="flex-1">
              <Text className={danger ? "text-danger font-medium" : "text-gray-900 font-medium"}>
                {doc.title}
              </Text>
              <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={2}>
                {fillTokens(doc.summary)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
          </Pressable>
        );
      })}
    </Screen>
  );
}

export default LegalHubScreen;
