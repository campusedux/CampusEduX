import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen, Button, AuthHeader } from "@/components/ui";
import { authService } from "@/services/auth.service";
import { describeAuthError } from "@/auth/authErrors";
import { OTP_LENGTH, applyOtpBackspace, applyOtpChange, emptyOtp } from "@/auth/otpInput";
import { abandonPasswordRecovery } from "@/auth/recovery";
import { useResendCooldown } from "@/auth/useResendCooldown";
import { goBackSafely } from "@/navigation/safeNavigation";
import type { AuthStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "OTPVerification">;
type Rte = RouteProp<AuthStackParamList, "OTPVerification">;

export function OTPVerificationScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const [digits, setDigits] = useState<string[]>(emptyOtp());
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);
  const resend = useResendCooldown(30);
  const startCooldown = resend.start;
  const isRecovery = params.context === "forgot-password";

  // The code was just sent by the previous screen: start the resend cooldown.
  useEffect(() => {
    startCooldown();
  }, [startCooldown]);

  // Backing out of the recovery flow (OTP or the Reset screen above it) must
  // not leave a live session / the "recovering" flag behind. No-op once the
  // password was saved.
  useEffect(() => {
    if (!isRecovery) return;
    return () => {
      void abandonPasswordRecovery();
    };
  }, [isRecovery]);

  const code = digits.join("");

  const handleChange = (text: string, index: number) => {
    const edit = applyOtpChange(digits, index, text);
    setDigits(edit.digits);
    if (edit.focusIndex !== null) inputs.current[edit.focusIndex]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key !== "Backspace") return;
    const edit = applyOtpBackspace(digits, index);
    if (edit.focusIndex !== null) {
      setDigits(edit.digits);
      inputs.current[edit.focusIndex]?.focus();
    }
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
      notify("Verification failed", describeAuthError(error, "Invalid or expired code.").message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!resend.canResend) return;
    resend.start();
    try {
      await authService.sendOTP(params.identifier);
      notify("Code sent", "A new verification code has been sent.");
    } catch (error: any) {
      notify("Could not resend code", describeAuthError(error, "Please try again.").message);
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
            onKeyPress={(e) => handleKeyPress(e.nativeEvent.key, index)}
            // Not 1: a pasted / autofilled 6-digit code must reach handleChange whole.
            maxLength={OTP_LENGTH}
            textContentType="oneTimeCode"
            selectTextOnFocus
            className="border border-gray-200 rounded-xl text-center text-xl font-semibold text-gray-900"
            style={{ width: 46, height: 54 }}
          />
        ))}
      </View>

      <Button label="Verify Code" loading={submitting} onPress={handleVerify} />

      <Pressable onPress={handleResend} disabled={!resend.canResend} className="self-center mt-6">
        <Text className={resend.canResend ? "text-primary font-medium" : "text-gray-400 font-medium"}>
          {resend.canResend ? "Resend Code" : `Resend code in ${resend.secondsLeft}s`}
        </Text>
      </Pressable>
    </Screen>
  );
}

export default OTPVerificationScreen;
