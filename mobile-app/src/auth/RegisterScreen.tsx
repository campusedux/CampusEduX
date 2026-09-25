import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Input, Button, AuthHeader } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { goBackSafely } from "@/navigation/safeNavigation";
import { describeAuthError, interpretSignUp } from "@/auth/authErrors";
import { useResendCooldown } from "@/auth/useResendCooldown";
import type { AuthStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Register">;
type Rte = RouteProp<AuthStackParamList, "Register">;

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    mobileNumber: z.string().min(10, "Enter a valid mobile number"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    referralCode: z.string().optional(),
    agreeToTerms: z.literal(true, {
      message: "You must agree to the Terms & Conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { register, resendVerificationEmail } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "verify_email" | "already_registered"; message: string; email: string } | null>(null);
  const [resendNote, setResendNote] = useState<string | null>(null);
  const resend = useResendCooldown();
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      // Text fields need "" defaults: starting as `undefined` makes React warn
      // about an uncontrolled input becoming controlled, and makes Zod emit a
      // raw type error instead of the messages defined in the schema above.
      fullName: "",
      email: "",
      mobileNumber: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: undefined as any,
      referralCode: params?.referralCode ?? "",
    },
  });

  const agreeToTerms = watch("agreeToTerms");

  const onSubmit = async (values: RegisterForm) => {
    setSubmitting(true);
    setFormError(null);
    setNotice(null);
    setResendNote(null);
    try {
      const data = await register(values);
      if (!mounted.current) return;
      const outcome = interpretSignUp(data);
      // "signed_in": email confirmation is off, a session exists and the auth
      // listener moves RootNavigator on — nothing to tell the user here.
      if (outcome.kind !== "signed_in") {
        setNotice({ kind: outcome.kind, message: outcome.message, email: values.email.trim() });
        if (outcome.kind === "verify_email") resend.start();
      }
    } catch (error: any) {
      if (mounted.current) setFormError(describeAuthError(error, "Registration failed. Please try again.").message);
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (!notice || !resend.canResend) return;
    resend.start();
    try {
      await resendVerificationEmail(notice.email);
      if (mounted.current) setResendNote("Verification email sent again. Check your inbox (and spam).");
    } catch (error) {
      if (mounted.current) setResendNote(describeAuthError(error).message);
    }
  };

  return (
    <Screen scroll className="px-6">
      <AuthHeader
        title="Create Account"
        subtitle="Join CampusEduX and start your journey"
        onBack={() => goBackSafely(navigation, "Login")}
        className="mb-8"
      />

      <Controller
        control={control}
        name="fullName"
        render={({ field: { onChange, value } }) => (
          <Input icon="person-outline" placeholder="Full Name" value={value} onChangeText={onChange} error={errors.fullName?.message} />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <Input
            icon="mail-outline"
            placeholder="Email Address"
            autoCapitalize="none"
            keyboardType="email-address"
            value={value}
            onChangeText={onChange}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="mobileNumber"
        render={({ field: { onChange, value } }) => (
          <Input
            icon="call-outline"
            placeholder="Mobile Number"
            keyboardType="phone-pad"
            value={value}
            onChangeText={onChange}
            error={errors.mobileNumber?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <Input icon="lock-closed-outline" placeholder="Password" isPassword value={value} onChangeText={onChange} error={errors.password?.message} />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, value } }) => (
          <Input
            icon="lock-closed-outline"
            placeholder="Confirm Password"
            isPassword
            value={value}
            onChangeText={onChange}
            error={errors.confirmPassword?.message}
          />
        )}
      />
      {params?.referralCode ? (
        <Controller
          control={control}
          name="referralCode"
          render={({ field: { onChange, value } }) => (
            <Input
              icon="gift-outline"
              placeholder="Referral Code"
              autoCapitalize="characters"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
      ) : null}

      <Pressable
        className="flex-row items-start mb-6"
        onPress={() => setValue("agreeToTerms", (!agreeToTerms) as true, { shouldValidate: true })}
      >
        <View
          className="w-5 h-5 rounded border items-center justify-center mr-2 mt-0.5"
          style={{ borderColor: agreeToTerms ? "#4F39F6" : "#D1D5DB", backgroundColor: agreeToTerms ? "#4F39F6" : "transparent" }}
        >
          {agreeToTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        <Text className="flex-1 text-gray-500 text-sm">
          I agree to the{" "}
          <Text
            className="text-primary font-medium"
            onPress={() => navigation.navigate("LegalDocument", { docId: "terms" })}
          >
            Terms & Conditions
          </Text>{" "}
          and{" "}
          <Text
            className="text-primary font-medium"
            onPress={() => navigation.navigate("LegalDocument", { docId: "privacy-policy" })}
          >
            Privacy Policy
          </Text>
        </Text>
      </Pressable>
      {errors.agreeToTerms && <Text className="text-danger text-xs -mt-4 mb-4">{errors.agreeToTerms.message}</Text>}

      {formError ? (
        <View className="mb-4 rounded-xl border border-danger bg-red-50 px-4 py-3">
          <Text className="text-danger text-sm">{formError}</Text>
        </View>
      ) : null}

      {notice ? (
        <View className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <Text className="text-gray-800 text-sm">{notice.message}</Text>
          {notice.kind === "verify_email" ? (
            <Pressable onPress={onResend} disabled={!resend.canResend} accessibilityRole="button" className="mt-2">
              <Text className="text-primary font-medium text-sm">
                {resend.canResend ? "Resend verification email" : `Resend available in ${resend.secondsLeft}s`}
              </Text>
            </Pressable>
          ) : null}
          {resendNote ? <Text className="text-gray-600 text-sm mt-1">{resendNote}</Text> : null}
          <Pressable onPress={() => (navigation as any).navigate("Login")} accessibilityRole="button" className="mt-2">
            <Text className="text-primary font-semibold text-sm">Go to Login</Text>
          </Pressable>
        </View>
      ) : null}

      <Button label="Register" loading={submitting} onPress={handleSubmit(onSubmit)} />

      <View className="flex-row justify-center mt-8 mb-4">
        <Text className="text-gray-500">Already have an account? </Text>
        <Pressable onPress={() => (navigation as any).navigate("Login")}>
          <Text className="text-primary font-semibold">Login</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

export default RegisterScreen;
