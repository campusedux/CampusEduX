import { performLogoutCleanup } from "@/lib/logoutCleanup";
import React, { useState } from "react";
import { View, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button } from "@/components/ui";
import { notify } from "@/lib/notify";
import { authService } from "@/services/auth.service";

/**
 * Confirmation screen for logging out (matches the "Are you sure?" modal
 * in the mockup, presented as a full screen here since it's reached via
 * drawer/profile navigation rather than an in-place dialog).
 */
export function LogoutScreen() {
  const navigation = useNavigation();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authService.logout();
      // RootNavigator swaps to the auth stack as soon as the store clears.
      await performLogoutCleanup();
    } catch (error: any) {
      setLoggingOut(false);
      notify("Logout failed", error?.message ?? "Please try again.");
    }
  };

  return (
    <Screen className="px-6 items-center justify-center">
      <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{ backgroundColor: "#EEF0FF" }}>
        <Ionicons name="log-out-outline" size={44} color="#4F39F6" />
      </View>
      <Text className="text-xl font-bold text-gray-900 mb-2 text-center">Are you sure you want to logout?</Text>
      <Text className="text-gray-500 text-center mb-10">You&apos;ll need to log in again to access your account.</Text>

      <Button label="Logout" variant="danger" loading={loggingOut} onPress={handleLogout} className="w-full mb-3" />
      <Button label="Cancel" variant="outline" onPress={() => navigation.goBack()} className="w-full" />
    </Screen>
  );
}

export default LogoutScreen;
