import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Screen, Input, Button, AuthHeader } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { goBackSafely } from "@/navigation/safeNavigation";
import { describeAuthError } from "@/auth/authErrors";
import { useResendCooldown } from "@/auth/useResendCooldown";
import type { AuthStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Login">;

const loginSchema = z.object({
  identifier: z.string().min(3, "Enter your email or mobile number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginForm = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { login, loginWithGoogle, resendVerificationEmail } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Set when the failure was "Email not confirmed": holds the address to re-send to.
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendNote, setResendNote] = useState<string | null>(null);
  const resend = useResendCooldown();
  // The navigator swaps this screen out as soon as login succeeds, so guard late state updates.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    // Without defaults the fields start as `undefined`, which (a) makes React
    // warn "changing an uncontrolled input to be controlled" on first keypress
    // and (b) makes Zod report a raw type error ("expected string, received
    // undefined") instead of the friendly messages defined above.
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = async (values: LoginForm) => {
    setSubmitting(true);
    setFormError(null);
    setUnverifiedEmail(null);
    setResendNote(null);
    try {
      await login(values);
      // No navigation here: RootNavigator swaps to ProfileSetup or Main
      // automatically once the profile lands in the auth store. It routes to
      // setup only when course/branch/year are missing, so a returning user
      // is never asked for them again.
    } catch (error: any) {
      if (!mounted.current) return;
      // Rendered inline rather than via Alert.alert: Alert is a no-op stub in
      // react-native-web, so on Expo Web the failure was invisible.
      const friendly = describeAuthError(error, "Please check your credentials and try again.");
      setFormError(friendly.message);
      const email = typeof error?.email === "string" && error.email ? error.email : values.identifier.trim();
      if (friendly.canResendVerification && /\S+@\S+\.\S+/.test(email)) setUnverifiedEmail(email);
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (!unverifiedEmail || !resend.canResend) return;
    resend.start();
    try {
      await resendVerificationEmail(unverifiedEmail);
      if (mounted.current) setResendNote("Verification email sent. Check your inbox (and spam).");
    } catch (error) {
      if (mounted.current) setResendNote(describeAuthError(error).message);
    }
  };

  const onGoogle = async () => {
    setGoogleSubmitting(true);
    setFormError(null);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      if (!mounted.current) return;
      setFormError(describeAuthError(error, "Google sign-in failed. Please try again.").message);
    } finally {
      if (mounted.current) setGoogleSubmitting(false);
    }
  };

  return (
    <Screen scroll className="px-6">
      <AuthHeader
        title="Welcome Back! 👋"
        subtitle="Login to continue"
        onBack={() => goBackSafely(navigation, "Onboarding1")}
        className="mb-8"
        showLogo
      />

      <Controller
        control={control}
        name="identifier"
        render={({ field: { onChange, value } }) => (
          <Input
            icon="person-outline"
            placeholder="Email or Mobile Number"
            autoCapitalize="none"
            value={value}
            onChangeText={onChange}
            error={errors.identifier?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <Input
            icon="lock-closed-outline"
            placeholder="Password"
            isPassword
            value={value}
            onChangeText={onChange}
            error={errors.password?.message}
          />
        )}
      />

      <Pressable onPress={() => (navigation as any).navigate("ForgotPassword")} className="self-end mb-6">
        <Text className="text-primary font-medium">Forgot Password?</Text>
      </Pressable>

      {formError ? (
        <View className="mb-4 rounded-xl border border-danger bg-red-50 px-4 py-3">
          <Text className="text-danger text-sm">{formError}</Text>
          {unverifiedEmail ? (
            <Pressable onPress={onResend} disabled={!resend.canResend} accessibilityRole="button" className="mt-2">
              <Text className="text-primary font-medium text-sm">
                {resend.canResend ? "Resend verification email" : `Resend available in ${resend.secondsLeft}s`}
              </Text>
            </Pressable>
          ) : null}
          {resendNote ? <Text className="text-gray-600 text-sm mt-1">{resendNote}</Text> : null}
        </View>
      ) : null}

      <Button label="Login" loading={submitting} onPress={handleSubmit(onSubmit)} />

      <View className="flex-row items-center my-6">
        <View className="flex-1 h-px bg-gray-200" />
        <Text className="mx-3 text-gray-400 text-sm">or continue with</Text>
        <View className="flex-1 h-px bg-gray-200" />
      </View>

      <Button
        label="Continue with Google"
        variant="outline"
        leftIcon="logo-google"
        iconColor="#EA4335"
        loading={googleSubmitting}
        onPress={onGoogle}
      />

      <View className="flex-row justify-center mt-8 mb-4">
        <Text className="text-gray-500">Don&apos;t have an account? </Text>
        <Pressable onPress={() => (navigation as any).navigate("Register")}>
          <Text className="text-primary font-semibold">Register</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

export default LoginScreen;
