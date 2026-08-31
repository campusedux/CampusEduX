import React, { useState } from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { notify } from "@/lib/notify";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState } from "@/components/ui";
import { supportService } from "@/services/support.service";
import { BRAND } from "@/constants";

/**
 * Profile → Help & Support. FAQs come from the same `faqs` table the admin
 * panel edits (Banner & CMS → FAQ); "Contact Us" and "Email support" open the
 * mail composer — no fake ticket submission.
 */
export function HelpSupportScreen() {
  const navigation = useNavigation();
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data: faqs, isLoading } = useQuery({
    queryKey: ["help", "faqs"],
    queryFn: supportService.getFaqs,
  });

  const emailSupport = (subject: string) =>
    Linking.openURL(
      `mailto:${BRAND.supportEmail}?subject=${encodeURIComponent(subject)}`
    ).catch(() =>
      notify("Couldn't open mail app", `Email us at ${BRAND.supportEmail}.`)
    );

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Help & Support</Text>
      </View>

      <View className="rounded-2xl p-5 mb-6" style={{ backgroundColor: "#4F39F6" }}>
        <Text className="text-white font-bold text-base mb-1">How can we help you?</Text>
        <Text className="text-indigo-100 text-sm">Browse the FAQs below or email our team.</Text>
      </View>

      <Text className="text-gray-400 text-sm mb-3">Contact</Text>
      <Pressable
        onPress={() => emailSupport("Support request")}
        className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 mb-3"
      >
        <View className="flex-row items-center flex-1">
          <Ionicons name="mail-outline" size={20} color="#4F39F6" />
          <View className="ml-3 flex-1">
            <Text className="font-semibold text-gray-900">Email Support</Text>
            <Text className="text-gray-400 text-sm mt-0.5">{BRAND.supportEmail}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
      </Pressable>

      <Text className="text-gray-400 text-sm mb-3 mt-3">Frequently Asked Questions</Text>
      {isLoading ? (
        <LoadingState label="Loading FAQs..." />
      ) : (
        (faqs ?? []).map((faq) => {
          const open = expanded === faq.id;
          return (
            <Pressable
              key={faq.id}
              onPress={() => setExpanded(open ? null : faq.id)}
              className="border-b border-gray-100 py-3.5"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-800 font-medium flex-1 pr-3">{faq.question}</Text>
                <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color="#9CA3AF" />
              </View>
              {open ? (
                <Text className="text-gray-500 text-sm leading-5 mt-2">{faq.answer}</Text>
              ) : null}
            </Pressable>
          );
        })
      )}

      <Pressable
        onPress={() => emailSupport("I still need help")}
        className="flex-row items-center justify-center mt-6 mb-8"
      >
        <Ionicons name="help-buoy-outline" size={16} color="#4F39F6" />
        <Text className="text-primary font-semibold ml-2">Still need help? Email us</Text>
      </Pressable>
    </Screen>
  );
}

export default HelpSupportScreen;
