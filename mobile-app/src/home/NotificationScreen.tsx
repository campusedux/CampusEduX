import React, { useMemo, useState } from "react";
import { View, Text, Pressable, SectionList, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useNotifications, useMarkNotificationRead } from "@/hooks/useHomeData";
import type { AppNotification, HomeStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<HomeStackParamList, "Notifications">;

const CATEGORY_ICON: Record<AppNotification["category"], keyof typeof Ionicons.glyphMap> = {
  offers: "pricetag-outline",
  updates: "cube-outline",
  messages: "chatbubble-outline",
};

type Tab = "all" | "offers" | "updates" | "messages";
const TABS: Tab[] = ["all", "offers", "updates", "messages"];

function groupByDay(notifications: AppNotification[]) {
  const today: AppNotification[] = [];
  const yesterday: AppNotification[] = [];
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  notifications.forEach((n) => {
    (new Date(n.createdAt) >= startOfToday ? today : yesterday).push(n);
  });

  return [
    ...(today.length ? [{ title: "Today", data: today }] : []),
    ...(yesterday.length ? [{ title: "Yesterday", data: yesterday }] : []),
  ];
}

export function NotificationScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const [tab, setTab] = useState<Tab>("all");

  const sections = useMemo(() => {
    const filtered = (data ?? []).filter((n) => tab === "all" || n.category === tab);
    return groupByDay(filtered);
  }, [data, tab]);

  return (
    <Screen className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Notifications</Text>
        <Pressable onPress={() => refetch()}>
          <Ionicons name="settings-outline" size={20} color="#111827" />
        </Pressable>
      </View>

      <View className="flex-row mb-4" style={{ gap: 8 }}>
        {TABS.map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            className="px-4 py-2 rounded-full border"
            style={{ backgroundColor: tab === t ? "#4F39F6" : "#fff", borderColor: tab === t ? "#4F39F6" : "#E5E7EB" }}
          >
            <Text className={tab === t ? "text-white font-medium capitalize text-xs" : "text-gray-600 capitalize text-xs"}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <LoadingState label="Loading notifications..." />
      ) : isError ? (
        <ErrorState message="Couldn't load notifications." onRetry={refetch} />
      ) : sections.length === 0 ? (
        <EmptyState icon="notifications-outline" title="No notifications yet" subtitle="We'll let you know when something new happens." />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({ section }) => (
            <Text className="text-gray-400 text-sm font-medium mb-2 mt-3">{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => !item.isRead && markRead.mutate(item.id)}
              className="bg-white rounded-2xl border border-gray-100 p-3 mb-3"
            >
              <View className="flex-row items-start">
                <View className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
                  <Ionicons name={CATEGORY_ICON[item.category]} size={16} color="#4F39F6" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">{item.title}</Text>
                  <Text className="text-gray-500 text-sm mt-0.5">{item.body}</Text>
                  <Text className="text-gray-400 text-xs mt-1">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
                {!item.isRead && <View className="w-2 h-2 rounded-full bg-primary mt-1" />}
              </View>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  className="w-full h-40 rounded-xl mt-3"
                  resizeMode="cover"
                />
              ) : null}
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

export default NotificationScreen;
