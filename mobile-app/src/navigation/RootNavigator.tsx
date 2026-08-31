import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthNavigator } from "./AuthNavigator";
import { ProfileSetupNavigator } from "./ProfileSetupNavigator";
import { DrawerNavigator } from "./DrawerNavigator";
import { SplashScreen } from "@/auth/SplashScreen";
import { useAuthStore } from "@/store/authStore";
import type { RootStackParamList } from "@/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Declarative auth switch (React Navigation "authentication flow" pattern):
 * the mounted stack is derived from the auth store, so signing in / out or
 * completing academic setup swaps navigators automatically — no screen ever
 * calls navigation.reset() to cross the auth boundary.
 *
 *   isLoading                     → branded splash (session being restored)
 *   !isAuthenticated              → AuthNavigator (onboarding / login)
 *   authenticated, setup pending  → ProfileSetupNavigator (course/branch/year)
 *   authenticated, setup complete → MainNavigator (drawer + tabs)
 */
export function RootNavigator() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasCompletedProfileSetup = useAuthStore((s) => s.hasCompletedProfileSetup);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="AuthNavigator" component={AuthNavigator} />
        ) : !hasCompletedProfileSetup ? (
          <Stack.Screen name="ProfileSetupNavigator" component={ProfileSetupNavigator} />
        ) : (
          <Stack.Screen name="MainNavigator" component={DrawerNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default RootNavigator;
