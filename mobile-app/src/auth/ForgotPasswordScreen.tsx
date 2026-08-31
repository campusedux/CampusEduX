import React, { useState } from "react";
import { Text } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen, Input, Button, AuthHeader } from "@/components/ui";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";
import { goBackSafely } from "@/navigation/safeNavigation";
import type { AuthStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const setPendingIdentifier = useAuthStore((s) => s.setPendingIdentifier);
  const setRecoveringPassword = useAuthStore((s) => s.setRecoveringPassword);
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (identifier.trim().length < 3) {
      setError("Enter your registered email or mobile number");
      return;
    }
    setError(undefined);
    setSubmitting(true);
    try {
      await authService.requestPasswordReset(identifier.trim());
      setPendingIdentifier(identifier.trim());
      // Verifying the OTP creates a real session; this flag tells the auth
      // listener not to treat the user as "logged in" until they set a new
      // password on the next screen.
      setRecoveringPassword(true);
      navigation.navigate("OTPVerification", {
        context: "forgot-password",
        identifier: identifier.trim(),
      });
    } catch (err: any) {
      notify("Something went wrong", err.message ?? "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll className="px-6">
      <AuthHeader
        title="Forgot Password?"
        onBack={() => goBackSafely(navigation, "Login")}
        className="mb-3"
      />
      <Text className="text-[15px] leading-5 text-gray-500 mb-8">
        Enter your registered email or mobile number and we&apos;ll send you a verification code.
      </Text>

      <Input
        icon="person-outline"
        placeholder="Email or Mobile Number"
        autoCapitalize="none"
        value={identifier}
        onChangeText={setIdentifier}
        error={error}
      />

      <Button label="Send Code" loading={submitting} onPress={onSubmit} className="mt-2" />
    </Screen>
  );
}

export default ForgotPasswordScreen;
