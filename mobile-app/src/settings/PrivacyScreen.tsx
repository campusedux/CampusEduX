import React, { useState } from "react";
import { View, Text, Pressable, Modal, FlatList, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, EmptyState } from "@/components/ui";
import { notify, confirmAction } from "@/lib/notify";
import { useCacheSize, useClearCache, useBlockedUsers, useUnblockUser } from "@/hooks/useSettings";
import type { SettingsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<SettingsStackParamList, "Privacy">;

export function PrivacyScreen() {
  const navigation = useNavigation<Nav>();
  const { data: cacheSizeMB, isLoading: isLoadingCache } = useCacheSize();
  const clearCache = useClearCache();
  const [blockedModalVisible, setBlockedModalVisible] = useState(false);
  const { data: blockedUsers, isLoading: isLoadingBlocked } = useBlockedUsers();
  const unblockUser = useUnblockUser();

  const handleClearCache = () => {
    confirmAction(
      "Clear Cache",
      "This will free up local storage. Continue?",
      async () => {
        try {
          await clearCache.mutateAsync();
          notify("Cache Cleared", "Temporary data has been removed.");
        } catch (error: any) {
          notify("Couldn't clear cache", error.message ?? "Please try again.");
        }
      },
      "Clear"
    );
  };

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Privacy</Text>
      </View>

      <Row
        icon="reader-outline"
        label="Legal & Privacy"
        subtitle="Privacy Policy, Terms, licences & more"
        onPress={() => (navigation as any).navigate("LegalHub")}
      />
      <Row
        icon="document-lock-outline"
        label="Privacy Policy"
        subtitle="What we collect and why"
        onPress={() => (navigation as any).navigate("LegalDocument", { docId: "privacy-policy" })}
      />
      <Row
        icon="key-outline"
        label="Data & Permissions"
        subtitle="Permissions used and data stored"
        onPress={() => (navigation as any).navigate("LegalDocument", { docId: "data-and-permissions" })}
      />
      <Row icon="people-outline" label="Blocked Users" subtitle="Manage blocked users" onPress={() => setBlockedModalVisible(true)} />
      <Row
        icon="trash-bin-outline"
        label="Clear Cache"
        subtitle={isLoadingCache ? "Calculating..." : `${cacheSizeMB?.toFixed(1) ?? 0} MB`}
        onPress={handleClearCache}
      />
      <Row
        icon="close-circle-outline"
        label="Delete Account"
        subtitle="Permanently delete your account"
        danger
        onPress={() => (navigation as any).navigate("DeleteAccount")}
      />

      <Modal visible={blockedModalVisible} animationType="slide" onRequestClose={() => setBlockedModalVisible(false)}>
        <Screen className="px-6">
          <View className="flex-row items-center mt-2 mb-5">
            <Pressable onPress={() => setBlockedModalVisible(false)} className="mr-3">
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </Pressable>
            <Text className="text-lg font-bold text-gray-900">Blocked Users</Text>
          </View>

          {isLoadingBlocked ? (
            <LoadingState label="Loading blocked users..." />
          ) : !blockedUsers || blockedUsers.length === 0 ? (
            <EmptyState icon="people-outline" title="No blocked users" subtitle="Users you block will appear here." />
          ) : (
            <FlatList
              data={blockedUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-3 mb-3">
                  <View className="flex-row items-center flex-1">
                    {item.avatarUrl ? (
                      <Image source={{ uri: item.avatarUrl }} className="w-10 h-10 rounded-full mr-3" />
                    ) : (
                      <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
                        <Ionicons name="person" size={18} color="#4F39F6" />
                      </View>
                    )}
                    <Text className="font-medium text-gray-900 flex-1" numberOfLines={1}>{item.fullName}</Text>
                  </View>
                  <Button
                    label="Unblock"
                    variant="outline"
                    onPress={() =>
                      unblockUser.mutate(item.id, {
                        onError: (error: any) =>
                          notify("Couldn't unblock", error?.message ?? "Please try again."),
                      })
                    }
                  />
                </View>
              )}
            />
          )}
        </Screen>
      </Modal>
    </Screen>
  );
}

function Row({
  icon,
  label,
  subtitle,
  danger,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-between py-3.5 border-b border-gray-100">
      <View className="flex-row items-center flex-1">
        <Ionicons name={icon} size={20} color={danger ? "#DC2626" : "#4F39F6"} />
        <View className="ml-3 flex-1">
          <Text className={danger ? "text-danger" : "text-gray-900"}>{label}</Text>
          <Text className="text-gray-400 text-xs mt-0.5">{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </Pressable>
  );
}

export default PrivacyScreen;
