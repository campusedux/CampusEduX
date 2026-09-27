import React from "react";
import { Linking, Platform, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui";
import { BRAND } from "@/constants/brand";
import { appConfigService } from "@/services/appConfig.service";
import { currentAppVersion, isUpdateRequired } from "@/lib/appVersion";

const THIRTY_MINUTES = 30 * 60 * 1000;

async function openStore() {
  const market = `market://details?id=${BRAND.androidPackage}`;
  try {
    if (Platform.OS === "android" && (await Linking.canOpenURL(market))) {
      await Linking.openURL(market);
      return;
    }
  } catch {
    // fall through to the web listing
  }
  await Linking.openURL(BRAND.playStoreUrl);
}

/**
 * Blocks the app with an "Update required" screen when the installed version is below the admin-set
 * site_settings.min_supported_app_version. While loading, on error, or with no valid minimum it renders
 * the app normally (fail open).
 */
export function ForceUpdateGate({ children }: { children: React.ReactNode }) {
  const { data: minimum } = useQuery({
    queryKey: ["app-config", "min-supported-version"],
    queryFn: () => appConfigService.getMinSupportedVersion(),
    staleTime: THIRTY_MINUTES,
    refetchInterval: THIRTY_MINUTES,
    retry: 1,
  });
  const current = currentAppVersion();

  if (!isUpdateRequired(current, minimum)) return <>{children}</>;

  return (
    <View
      className="flex-1 items-center justify-center bg-white px-8"
      accessibilityRole="alert"
      testID="force-update-screen"
    >
      <View className="w-20 h-20 rounded-3xl items-center justify-center mb-6" style={{ backgroundColor: "#EEF0FF" }}>
        <Ionicons name="cloud-download-outline" size={40} color="#4F39F6" />
      </View>
      <Text className="text-2xl font-bold text-gray-900 text-center">Update required</Text>
      <Text className="text-gray-600 text-center mt-3 leading-6">
        This version of {BRAND.name} ({current}) is no longer supported. Please update to version {minimum} or
        later to keep using the app.
      </Text>
      <View className="w-full mt-8">
        <Button
          label={Platform.OS === "android" ? "Update on Google Play" : "Get the latest version"}
          leftIcon="logo-google-playstore"
          onPress={openStore}
          fullWidth
        />
      </View>
    </View>
  );
}

export default ForceUpdateGate;
