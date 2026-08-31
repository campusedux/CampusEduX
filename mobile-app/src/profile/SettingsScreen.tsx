import React, { useState } from "react";
import { View, Text, Pressable, Switch, Modal, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button } from "@/components/ui";
import { notify, confirmAction } from "@/lib/notify";
import { authService } from "@/services/auth.service";
import { useSettingsStore } from "@/store/settingsStore";
import { useUpdatePreferences, useDeleteAccount } from "@/hooks/useSettings";
import { useAuthStore } from "@/store/authStore";

export function SettingsScreen() {
  const navigation = useNavigation();
  const preferences = useSettingsStore((s) => s.preferences);
  const updatePreferences = useUpdatePreferences();
  const deleteAccount = useDeleteAccount();
  const reset = useAuthStore((s) => s.reset);
  const user = useAuthStore((s) => s.user);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      notify("Invalid password", "Password must be at least 6 characters.");
      return;
    }
    setIsUpdating(true);
    try {
      await authService.updatePassword(newPassword);
      setPasswordModalVisible(false);
      setNewPassword("");
      notify("Password updated", "Your password has been changed successfully.");
    } catch (error: any) {
      notify("Couldn't update password", error.message ?? "Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = () => {
    confirmAction(
      "Delete Account",
      "This permanently deletes your account and all your data (purchases, applications, resumes). This cannot be undone.",
      async () => {
        try {
          await deleteAccount.mutateAsync();
          await authService.logout().catch(() => undefined);
          reset();
        } catch (error: any) {
          notify("Couldn't delete account", error.message ?? "Please try again or contact support.");
        }
      },
      "Delete Permanently"
    );
  };

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Settings</Text>
      </View>

      <View className="flex-row items-center border border-gray-100 rounded-2xl p-4 mb-6">
        <View className="w-11 h-11 rounded-full items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
          <Ionicons name="person" size={20} color="#4F39F6" />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-gray-900" numberOfLines={1}>{user?.fullName || "Your Name"}</Text>
          <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>{user?.email}</Text>
        </View>
        <Pressable onPress={() => navigation.goBack()}>
          <Text className="text-primary text-sm font-medium">View Profile</Text>
        </Pressable>
      </View>

      <Text className="text-gray-400 text-sm mb-3">Preferences</Text>
      <Row
        icon="moon-outline"
        label="Dark Mode"
        right={
          <Switch
            value={preferences.theme === "dark"}
            onValueChange={(value) => updatePreferences({ theme: value ? "dark" : "light" })}
            trackColor={{ true: "#4F39F6" }}
          />
        }
      />
      <Row icon="language-outline" label="Language" value="English" onPress={() => (navigation.getParent() as any)?.navigate("SettingsModule", { screen: "Language" })} />
      <Row icon="notifications-outline" label="Notification Settings" onPress={() => (navigation.getParent() as any)?.navigate("SettingsModule", { screen: "Notification" })} />
      <Row icon="color-palette-outline" label="Theme" onPress={() => (navigation.getParent() as any)?.navigate("SettingsModule", { screen: "Theme" })} />

      <Text className="text-gray-400 text-sm mb-3 mt-5">Account</Text>
      <Row icon="lock-closed-outline" label="Change Password" onPress={() => setPasswordModalVisible(true)} />
      <Row icon="reader-outline" label="Legal & Privacy" onPress={() => (navigation.getParent() as any)?.navigate("SettingsModule", { screen: "LegalHub" })} />
      <Row icon="trash-outline" label="Delete Account" danger onPress={handleDeleteAccount} />

      <Modal visible={passwordModalVisible} transparent animationType="slide" onRequestClose={() => setPasswordModalVisible(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Change Password</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 text-gray-900 mb-4"
              style={{ height: 52 }}
              placeholder="New password (min. 6 characters)"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <Button label="Update Password" loading={isUpdating} onPress={handleChangePassword} className="mb-3" />
            <Button label="Cancel" variant="text" onPress={() => setPasswordModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function Row({
  icon,
  label,
  value,
  right,
  danger,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  right?: React.ReactNode;
  danger?: boolean;
  onPress?: () => void;
}) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} className="flex-row items-center justify-between py-3.5 border-b border-gray-100">
      <View className="flex-row items-center flex-1">
        <Ionicons name={icon} size={20} color={danger ? "#DC2626" : "#4F39F6"} />
        <Text className={`ml-3 ${danger ? "text-danger" : "text-gray-900"}`}>{label}</Text>
      </View>
      {right ?? (
        <View className="flex-row items-center">
          {value ? <Text className="text-gray-400 text-sm mr-2">{value}</Text> : null}
          {onPress ? <Ionicons name="chevron-forward" size={16} color="#D1D5DB" /> : null}
        </View>
      )}
    </Wrapper>
  );
}

export default SettingsScreen;
