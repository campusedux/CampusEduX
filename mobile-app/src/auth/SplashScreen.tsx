import React from "react";
import { View, Text, ActivityIndicator, StatusBar } from "react-native";
import { BrandLogo } from "@/components/ui/BrandLogo";

/**
 * Branded loading screen shown by RootNavigator while the auth session is
 * being restored on startup. Purely presentational — routing is decided
 * declaratively in RootNavigator from the auth store (see useAuthBootstrap).
 * White with the full logo, matching the native splash (app.json
 * expo-splash-screen), so there is no colour flash between the two.
 */
export function SplashScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View className="flex-1 items-center justify-center px-8">
        <BrandLogo variant="full" height={230} />
      </View>
      <View className="items-center pb-16">
        <ActivityIndicator color="#4F39F6" />
        <Text className="mt-3 text-sm text-gray-500">Loading...</Text>
      </View>
    </View>
  );
}

export default SplashScreen;
