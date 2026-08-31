import React from "react";
import { View, Text, ActivityIndicator, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * Branded loading screen shown by RootNavigator while the auth session is
 * being restored on startup. Purely presentational — routing is decided
 * declaratively in RootNavigator from the auth store (see useAuthBootstrap).
 */
export function SplashScreen() {
  return (
    <LinearGradient
      colors={["#4F39F6", "#3A28C8", "#312E81"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" />
      <View className="flex-1 items-center justify-center px-8">
        <View
          className="w-24 h-24 rounded-3xl items-center justify-center mb-6"
          style={{ backgroundColor: "rgba(255,255,255,0.14)" }}
        >
          <Text className="text-white text-5xl font-extrabold">C</Text>
        </View>
        <Text className="text-3xl font-bold mb-2">
          <Text className="text-white">Campus</Text>
          <Text style={{ color: "#FBBF24" }}>EduX</Text>
        </Text>
        <Text style={{ color: "#C7CBFF" }} className="text-base">
          Learn. Build. Get Placed.
        </Text>
      </View>
      <View className="items-center pb-16">
        <ActivityIndicator color="#ffffff" />
        <Text style={{ color: "#C7CBFF" }} className="mt-3 text-sm">
          Loading...
        </Text>
      </View>
    </LinearGradient>
  );
}

export default SplashScreen;
