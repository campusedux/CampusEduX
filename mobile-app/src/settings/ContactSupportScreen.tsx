import React, { useState } from "react";
import { View, Text, Pressable, Linking, Modal, TextInput } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button } from "@/components/ui";
import { WHATSAPP_DISPLAY, WHATSAPP_SUPPORT_MESSAGE, whatsappUrl } from "@/constants/contact";
import { BRAND } from "@/constants/brand";

export function ContactSupportScreen() {
  const navigation = useNavigation();
  const [ticketVisible, setTicketVisible] = useState(false);
  const [ticketText, setTicketText] = useState("");

  const submitTicket = async () => {
    if (!ticketText.trim()) {
      notify("Add a message", "Please describe your issue before submitting.");
      return;
    }
    const url = `mailto:${BRAND.supportEmail}?subject=${encodeURIComponent(
      "App feedback"
    )}&body=${encodeURIComponent(ticketText.trim())}`;
    try {
      await Linking.openURL(url);
      setTicketVisible(false);
      setTicketText("");
    } catch {
      notify("Couldn't open mail app", `Email us directly at ${BRAND.supportEmail}.`);
    }
  };

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Contact Support</Text>
      </View>

      <View className="rounded-2xl p-5 mb-6" style={{ backgroundColor: "#4F39F6" }}>
        <View className="flex-row items-center mb-1">
          <Ionicons name="headset" size={20} color="#FBBF24" />
          <Text className="text-white font-bold text-base ml-2">We&apos;re here to help!</Text>
        </View>
        <Text className="text-indigo-100 text-sm">Get in touch with our support team for any issues or queries.</Text>
      </View>

      <Text className="text-gray-400 text-sm mb-3">How can we help you?</Text>

      <Pressable onPress={() => Linking.openURL(`mailto:${BRAND.supportEmail}`)} className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 mb-3">
        <View className="flex-row items-center flex-1">
          <Ionicons name="mail-outline" size={20} color="#4F39F6" />
          <View className="ml-3 flex-1">
            <Text className="font-semibold text-gray-900">Email Us</Text>
            <Text className="text-gray-400 text-sm mt-0.5">{BRAND.supportEmail}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
      </Pressable>

      <Pressable onPress={() => Linking.openURL(whatsappUrl(WHATSAPP_SUPPORT_MESSAGE)).catch(() => notify("Unable to open WhatsApp", "Please make sure WhatsApp is installed, or email us instead."))} className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 mb-3">
        <View className="flex-row items-center flex-1">
          <Ionicons name="logo-whatsapp" size={20} color="#4F39F6" />
          <View className="ml-3 flex-1">
            <Text className="font-semibold text-gray-900">WhatsApp Support</Text>
            <Text className="text-gray-400 text-sm mt-0.5">{WHATSAPP_DISPLAY}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
      </Pressable>

      <Pressable onPress={() => setTicketVisible(true)} className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 mb-6">
        <View className="flex-row items-center flex-1">
          <Ionicons name="document-text-outline" size={20} color="#4F39F6" />
          <View className="ml-3 flex-1">
            <Text className="font-semibold text-gray-900">Send Feedback</Text>
            <Text className="text-gray-400 text-sm mt-0.5">Help us improve CampusEduX</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
      </Pressable>

      <Modal visible={ticketVisible} transparent animationType="slide" onRequestClose={() => setTicketVisible(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Send Feedback</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 mb-4"
              placeholder="Tell us what's on your mind..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={ticketText}
              onChangeText={setTicketText}
              style={{ height: 100, textAlignVertical: "top" }}
            />
            <Button label="Submit" onPress={submitTicket} className="mb-3" />
            <Button label="Cancel" variant="text" onPress={() => setTicketVisible(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

export default ContactSupportScreen;
