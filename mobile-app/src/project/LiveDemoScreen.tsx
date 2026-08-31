import React from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button } from "@/components/ui";
import type { ProjectStackParamList } from "@/types";

type Rte = RouteProp<ProjectStackParamList, "LiveDemo">;

/**
 * Opens the project's hosted demo in the device browser rather than an
 * in-app WebView — most demo hosts (Netlify/Vercel previews, etc.) render
 * more reliably and securely this way.
 */
export function LiveDemoScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();

  const openDemo = async () => {
    const canOpen = await Linking.canOpenURL(params.demoUrl);
    if (!canOpen) {
      notify("Can't open demo", "This demo link looks invalid.");
      return;
    }
    Linking.openURL(params.demoUrl);
  };

  return (
    <Screen className="px-6 items-center justify-center">
      <Pressable onPress={() => navigation.goBack()} className="absolute top-14 left-6">
        <Ionicons name="arrow-back" size={22} color="#111827" />
      </Pressable>

      <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{ backgroundColor: "#EEF0FF" }}>
        <Ionicons name="globe-outline" size={44} color="#4F39F6" />
      </View>
      <Text className="text-xl font-bold text-gray-900 mb-2 text-center">{params.title}</Text>
      <Text className="text-gray-500 text-center mb-8">
        Explore a fully working live demo of this project, hosted online.
      </Text>

      <Button label="Visit Live Demo" onPress={openDemo} className="w-full" />
    </Screen>
  );
}

export default LiveDemoScreen;
