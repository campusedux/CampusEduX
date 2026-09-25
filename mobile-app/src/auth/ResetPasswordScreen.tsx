import React, { useEffect, useState } from "react";
import { Text } from "react-native";
import { notify, notifyThen } from "@/lib/notify";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen, Input, Button, AuthHeader } from "@/components/ui";
import { authService } from "@/services/auth.service";
import { describeAuthError } from "@/auth/authErrors";
import { abandonPasswordRecovery } from "@/auth/recovery";
import { performLogoutCleanup } from "@/lib/logoutCleanup";
import { useAuthStore } from "@/store/authStore";
import { goBackSafely } from "@/navigation/safeNavigation";
import type { AuthStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "ResetPassword">;
type Rte = RouteProp<AuthStackParamList, "ResetPassword">;

export function ResetPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const setRecoveringPassword = useAuthStore((s) => s.setRecoveringPassword);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  // Leaving without saving a password (back / unmount) ends the recovery
  // session; a no-op after a successful save (the flag is already cleared).
  useEffect(
    () => () => {
      void abandonPasswordRecovery();
    },
    []
  );

  const onSubmit = async () => {
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError(undefined);
    setSubmitting(true);
    try {
      await authService.updatePassword(password);
      // End the recovery session so the user re-authenticates with the new
      // password (and the auth listener stops holding them on this screen).
      await authService.logout();
      setRecoveringPassword(false);
      await performLogoutCleanup();
      notifyThen(
        "Password updated",
        "You can now log in with your new password.",
        () => navigation.reset({ index: 0, routes: [{ name: "Login" }] })
      );
    } catch (err: any) {
      notify("Something went wrong", describeAuthError(err, "Please try again.").message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll className="px-6">
      <AuthHeader
        title="Set New Password"
        onBack={() => goBackSafely(navigation, "Login")}
        className="mb-3"
      />
      <Text className="text-[15px] leading-5 text-gray-500 mb-8">
        Create a new password for{" "}
        <Text className="text-gray-900 font-semibold">{params.identifier}</Text>
      </Text>

      <Input icon="lock-closed-outline" placeholder="New Password" isPassword value={password} onChangeText={setPassword} />
      <Input
        icon="lock-closed-outline"
        placeholder="Confirm New Password"
        isPassword
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={error}
      />

      <Button label="Save New Password" loading={submitting} onPress={onSubmit} className="mt-2" />
    </Screen>
  );
}

export default ResetPasswordScreen;
