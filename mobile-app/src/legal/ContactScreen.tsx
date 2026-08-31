import React from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui";
import { notify } from "@/lib/notify";
import { LEGAL } from "@/constants/legal";
import { LegalDocumentBody } from "./LegalDocumentBody";

function MailButton({ label, email, subject }: { label: string; email: string; subject: string }) {
  const onPress = () => {
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    Linking.openURL(url).catch(() =>
      notify("Couldn't open your mail app", `Email us directly at ${email}.`),
    );
  };
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 mb-3"
    >
      <View className="flex-row items-center flex-1">
        <Ionicons name="mail-outline" size={18} color="#4F39F6" />
        <View className="ml-3 flex-1">
          <Text className="text-gray-900 font-medium">{label}</Text>
          <Text className="text-gray-400 text-xs mt-0.5">{email}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </Pressable>
  );
}

export function ContactScreen() {
  const navigation = useNavigation<any>();

  return (
    <Screen scroll className="px-6 pb-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Contact Us</Text>
      </View>

      <View className="mb-4">
        <MailButton label="Support" email={LEGAL.supportEmail} subject="CampusEduX support request" />
        <MailButton
          label="Privacy & account deletion"
          email={LEGAL.privacyEmail}
          subject="Privacy request"
        />
        <MailButton
          label="Legal & copyright"
          email={LEGAL.legalEmail}
          subject="Legal enquiry"
        />
      </View>

      <LegalDocumentBody
        docId="contact"
        onNavigateRelated={(id) =>
          id === "delete-account"
            ? navigation.navigate("DeleteAccount")
            : navigation.navigate("LegalDocument", { docId: id })
        }
      />
    </Screen>
  );
}

export default ContactScreen;
