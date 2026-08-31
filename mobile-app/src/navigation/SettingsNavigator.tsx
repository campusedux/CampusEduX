import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SettingsScreen } from "@/settings/SettingsScreen";
import { ThemeScreen } from "@/settings/ThemeScreen";
import { LanguageScreen } from "@/settings/LanguageScreen";
import { NotificationScreen } from "@/settings/NotificationScreen";
import { PrivacyScreen } from "@/settings/PrivacyScreen";
import { TermsScreen } from "@/settings/TermsScreen";
import { ContactSupportScreen } from "@/settings/ContactSupportScreen";
import { AboutScreen } from "@/settings/AboutScreen";
import {
  LegalHubScreen,
  LegalDocumentScreen,
  ContactScreen,
  DeleteAccountInfoScreen,
} from "@/legal";
import type { SettingsStackParamList } from "@/types";

const Stack = createNativeStackNavigator<SettingsStackParamList>();

/** Module 11 - Settings, reached from the drawer. */
export function SettingsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Theme" component={ThemeScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />
      <Stack.Screen name="Notification" component={NotificationScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="LegalHub" component={LegalHubScreen} />
      <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountInfoScreen} />
    </Stack.Navigator>
  );
}

export default SettingsNavigator;
