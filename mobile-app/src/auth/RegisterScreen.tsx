import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { notify, notifyThen } from "@/lib/notify";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Input, Button, AuthHeader } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { goBackSafely } from "@/navigation/safeNavigation";
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
  const { register } = useAuth();
  const [submitting, setSubmitting] = useState(false);

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
    try {
      await register(values);
      notifyThen("Verify your email",
        "We've sent a verification link to your email. Please verify before logging in.", () => (navigation as any).navigate("Login"));
    } catch (error: any) {
      notify("Registration failed", error.message ?? "Please try again.");
    } finally {
      setSubmitting(false);
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
