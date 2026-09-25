import React from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui";
import { notify } from "@/lib/notify";
import { WHATSAPP_DISPLAY, WHATSAPP_SUPPORT_MESSAGE, whatsappUrl } from "@/constants/contact";
import { BRAND } from "@/constants/brand";

export function SupportScreen() {
  const navigation = useNavigation();

  const SUPPORT_OPTIONS = [
    {
      icon: "mail-outline" as const,
      label: "Email Support",
      subtitle: BRAND.supportEmail,
      onPress: () => Linking.openURL(`mailto:${BRAND.supportEmail}`),
    },
    {
      icon: "logo-whatsapp" as const,
      label: "WhatsApp Support",
      subtitle: WHATSAPP_DISPLAY,
      onPress: () =>
        Linking.openURL(whatsappUrl(WHATSAPP_SUPPORT_MESSAGE)).catch(() =>
          notify("Unable to open WhatsApp", "Please make sure WhatsApp is installed, or email us instead.")
        ),
    },
    {
      icon: "chatbox-ellipses-outline" as const,
      label: "More Support Options",
      subtitle: "Submit a ticket or browse help articles",
      onPress: () => (navigation.getParent() as any)?.navigate("SettingsModule", { screen: "ContactSupport" }),
    },
  ];

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Support</Text>
      </View>

      <View className="flex-row items-center border border-gray-100 rounded-2xl p-4 mb-6" style={{ backgroundColor: "#EEF0FF" }}>
        <View className="w-11 h-11 rounded-full items-center justify-center mr-3" style={{ backgroundColor: "#fff" }}>
          <Ionicons name="headset-outline" size={22} color="#4F39F6" />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-gray-900">We&apos;re here to help!</Text>
          <Text className="text-gray-500 text-sm mt-0.5">Get in touch with our support team for any issues or queries.</Text>
        </View>
      </View>

      <Text className="text-gray-400 text-sm mb-3">How can we help you?</Text>
      {SUPPORT_OPTIONS.map((option) => (
        <Pressable
          key={option.label}
          onPress={option.onPress}
          className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 mb-3"
        >
          <View className="flex-row items-center flex-1">
            <Ionicons name={option.icon} size={20} color="#4F39F6" />
            <View className="ml-3 flex-1">
              <Text className="font-semibold text-gray-900">{option.label}</Text>
              <Text className="text-gray-400 text-sm mt-0.5">{option.subtitle}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        </Pressable>
      ))}
    </Screen>
  );
}

export default SupportScreen;
