import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui";
import type { LegalDocId } from "@/types";
import { LEGAL_DOCUMENTS } from "./content";
import { LegalDocumentBody } from "./LegalDocumentBody";

/**
 * Renders any legal document by id. Mounted in both SettingsNavigator (in-app,
 * authenticated) and AuthNavigator (so Register can link to Terms / Privacy
 * before the user has an account). Related-policy chips push another instance.
 */
export function LegalDocumentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const docId: LegalDocId = route.params?.docId ?? "privacy-policy";
  const title = LEGAL_DOCUMENTS[docId]?.title ?? "Legal";

  return (
    <Screen scroll className="px-6 pb-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 flex-1" numberOfLines={1}>
          {title}
        </Text>
      </View>

      <LegalDocumentBody
        docId={docId}
        onNavigateRelated={(id) => navigation.push("LegalDocument", { docId: id })}
      />
    </Screen>
  );
}

export default LegalDocumentScreen;
