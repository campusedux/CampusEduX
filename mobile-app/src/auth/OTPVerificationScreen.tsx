import React, { useRef, useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen, Button, AuthHeader } from "@/components/ui";
import { authService } from "@/services/auth.service";
import { goBackSafely } from "@/navigation/safeNavigation";
import type { AuthStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "OTPVerification">;
type Rte = RouteProp<AuthStackParamList, "OTPVerification">;

const OTP_LENGTH = 6;

export function OTPVerificationScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const code = digits.join("");

  const handleChange = (text: string, index: number) => {
    const next = [...digits];
    next[index] = text.replace(/[^0-9]/g, "").slice(-1);
    setDigits(next);
    if (text && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleVerify = async () => {
    if (code.length !== OTP_LENGTH) {
      notify("Incomplete code", `Please enter all ${OTP_LENGTH} digits.`);
      return;
    }
    setSubmitting(true);
    try {
      await authService.verifyOTP(params.identifier, code);
      if (params.context === "forgot-password") {
        navigation.navigate("ResetPassword", { identifier: params.identifier });
      }
      // "register" context: verifyOTP created a session — useAuthBootstrap's
      // auth listener picks it up and RootNavigator moves on to profile setup.
    } catch (error: any) {
      notify("Verification failed", error.message ?? "Invalid or expired code.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      await authService.sendOTP(params.identifier);
      notify("Code sent", "A new verification code has been sent.");
    } catch (error: any) {
      notify("Could not resend code", error.message ?? "Please try again.");
    }
  };

  return (
    <Screen scroll className="px-6">
      <AuthHeader
        title="Enter OTP Code"
        onBack={() => goBackSafely(navigation, "Login")}
        className="mb-3"
      />
      <Text className="text-[15px] leading-5 text-gray-500 mb-8">
        Please enter the {OTP_LENGTH}-digit code sent to{" "}
        <Text className="text-gray-900 font-semibold">{params.identifier}</Text>
      </Text>

      <View className="flex-row justify-between mb-8">
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputs.current[index] = ref; }}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            keyboardType="number-pad"
            maxLength={1}
            className="border border-gray-200 rounded-xl text-center text-xl font-semibold text-gray-900"
            style={{ width: 46, height: 54 }}
          />
        ))}
      </View>

      <Button label="Verify Code" loading={submitting} onPress={handleVerify} />

      <Pressable onPress={handleResend} className="self-center mt-6">
        <Text className="text-primary font-medium">Resend Code</Text>
      </Pressable>
    </Screen>
  );
}

export default OTPVerificationScreen;
