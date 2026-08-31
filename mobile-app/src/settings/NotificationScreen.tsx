import React from "react";
import { View, Text, Pressable, Switch } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui";
import { useSettingsStore } from "@/store/settingsStore";
import { useUpdateNotifications } from "@/hooks/useSettings";
import type { NotificationPreferences } from "@/types";

export function NotificationScreen() {
  const navigation = useNavigation();
  const notifications = useSettingsStore((s) => s.notifications);
  const updateNotifications = useUpdateNotifications();

  const toggle = (key: keyof NotificationPreferences) => (value: boolean) => updateNotifications({ [key]: value });

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Notification</Text>
      </View>

      <Text className="text-gray-400 text-sm mb-3">Push Notifications</Text>
      <ToggleRow
        label="Enable Notifications"
        subtitle="Receive push notifications"
        value={notifications.pushEnabled}
        onValueChange={toggle("pushEnabled")}
      />
      <ToggleRow
        label="Sound"
        subtitle="Play sound for notifications"
        value={notifications.soundEnabled}
        onValueChange={toggle("soundEnabled")}
        disabled={!notifications.pushEnabled}
      />
      <ToggleRow
        label="Vibration"
        subtitle="Vibrate for notifications"
        value={notifications.vibrationEnabled}
        onValueChange={toggle("vibrationEnabled")}
        disabled={!notifications.pushEnabled}
      />

      <Text className="text-gray-400 text-sm mb-3 mt-6">Notification Types</Text>
      <ToggleRow label="Promotions" subtitle="Receive updates and offers" value={notifications.promotions} onValueChange={toggle("promotions")} />
      <ToggleRow label="Job Alerts" subtitle="Get notified for new jobs" value={notifications.jobAlerts} onValueChange={toggle("jobAlerts")} />
      <ToggleRow
        label="Application Updates"
        subtitle="Get application status updates"
        value={notifications.applicationUpdates}
        onValueChange={toggle("applicationUpdates")}
      />
      <ToggleRow
        label="Message Alerts"
        subtitle="Receive message notifications"
        value={notifications.messageAlerts}
        onValueChange={toggle("messageAlerts")}
      />
      <ToggleRow label="News & Updates" subtitle="Important announcements" value={notifications.newsUpdates} onValueChange={toggle("newsUpdates")} />
    </Screen>
  );
}

function ToggleRow({
  label,
  subtitle,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-3.5 border-b border-gray-100" style={{ opacity: disabled ? 0.4 : 1 }}>
      <View className="flex-1 mr-3">
        <Text className="text-gray-900">{label}</Text>
        <Text className="text-gray-400 text-xs mt-0.5">{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: "#4F39F6" }} disabled={disabled} />
    </View>
  );
}

export default NotificationScreen;
