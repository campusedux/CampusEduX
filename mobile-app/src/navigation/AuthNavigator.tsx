import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Onboarding1Screen } from "@/auth/Onboarding1Screen";
import { Onboarding2Screen } from "@/auth/Onboarding2Screen";
import { Onboarding3Screen } from "@/auth/Onboarding3Screen";
import { LoginScreen } from "@/auth/LoginScreen";
import { RegisterScreen } from "@/auth/RegisterScreen";
import { ForgotPasswordScreen } from "@/auth/ForgotPasswordScreen";
import { OTPVerificationScreen } from "@/auth/OTPVerificationScreen";
import { ResetPasswordScreen } from "@/auth/ResetPasswordScreen";
import { LegalDocumentScreen } from "@/legal";
import { useAuthStore } from "@/store/authStore";
import type { AuthStackParamList } from "@/types";

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Unauthenticated flow: onboarding (first run only) + the login / register /
 * forgot-password screens. Mounted by RootNavigator whenever there is no
 * session. The academic setup screens live in ProfileSetupNavigator, and the
 * startup splash is handled by RootNavigator's loading state.
 */
export function AuthNavigator() {
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={hasCompletedOnboarding ? "Login" : "Onboarding1"}
    >
      <Stack.Screen name="Onboarding1" component={Onboarding1Screen} />
      <Stack.Screen name="Onboarding2" component={Onboarding2Screen} />
      <Stack.Screen name="Onboarding3" component={Onboarding3Screen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} />
    </Stack.Navigator>
  );
}

export default AuthNavigator;
