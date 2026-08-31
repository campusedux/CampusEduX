import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Screen, Input, Button, AuthHeader } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { goBackSafely } from "@/navigation/safeNavigation";
import type { AuthStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Login">;

const loginSchema = z.object({
  identifier: z.string().min(3, "Enter your email or mobile number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginForm = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { login, loginWithGoogle } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
    try {
      await login(values);
      // No navigation here: RootNavigator swaps to ProfileSetup or Main
      // automatically once the profile lands in the auth store. It routes to
      // setup only when course/branch/year are missing, so a returning user
      // is never asked for them again.
    } catch (error: any) {
      // Rendered inline rather than via Alert.alert: Alert is a no-op stub in
      // react-native-web, so on Expo Web the failure was invisible.
      setFormError(
        error?.message ?? "Please check your credentials and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    setGoogleSubmitting(true);
    setFormError(null);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      setFormError(error?.message ?? "Google sign-in failed. Please try again.");
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <Screen scroll className="px-6">
      <AuthHeader
        title="Welcome Back! 👋"
        subtitle="Login to continue"
        onBack={() => goBackSafely(navigation, "Onboarding1")}
        className="mb-8"
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
