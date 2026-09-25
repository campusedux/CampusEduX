import React, { useMemo, useState } from "react";
import { View, Text, SectionList, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, ScreenHeader, HeaderIconButton, Chip, Card, IconTile, SkeletonList, ErrorState, EmptyState } from "@/components/ui";
import type { AccentName } from "@/constants/theme";
import { useNotifications, useMarkNotificationRead } from "@/hooks/useHomeData";
import type { AppNotification, HomeStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<HomeStackParamList, "Notifications">;

const CATEGORY_ICON: Record<AppNotification["category"], keyof typeof Ionicons.glyphMap> = {
  offers: "pricetag-outline",
  updates: "cube-outline",
  messages: "chatbubble-outline",
};

const CATEGORY_ACCENT: Record<AppNotification["category"], AccentName> = {
  offers: "orange",
  updates: "blue",
  messages: "teal",
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

  const countFor = (t: Tab) => (data ?? []).filter((n) => t === "all" || n.category === t).length;

  return (
    <Screen className="px-6">
      <ScreenHeader
        title="Notifications"
        onBack={() => navigation.goBack()}
        right={<HeaderIconButton icon="refresh-outline" label="Refresh notifications" onPress={() => refetch()} />}
      />

      <View className="flex-row flex-wrap">
        {TABS.map((t) => (
          <Chip
            key={t}
            label={t.charAt(0).toUpperCase() + t.slice(1)}
            active={tab === t}
            count={data ? countFor(t) : undefined}
            onPress={() => setTab(t)}
          />
        ))}
      </View>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : isError ? (
        <ErrorState message="Couldn't load notifications." onRetry={refetch} />
      ) : sections.length === 0 ? (
        <EmptyState icon="notifications-outline" title="No notifications yet" subtitle="We'll let you know when something new happens." />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text className="text-gray-500 text-xs font-bold uppercase mb-2 mt-3" style={{ letterSpacing: 0.6 }}>
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 12 }}>
              <Card
                variant={item.isRead ? "plain" : "tinted"}
                accent={item.isRead ? "indigo" : CATEGORY_ACCENT[item.category]}
                padding={14}
                onPress={() => !item.isRead && markRead.mutate(item.id)}
                accessibilityLabel={`${item.isRead ? "" : "Unread. "}${item.title}`}
              >
                <View className="flex-row items-start">
                  <View className="mr-3">
                    <IconTile icon={CATEGORY_ICON[item.category]} accent={CATEGORY_ACCENT[item.category]} variant="soft" size={40} />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-gray-900 ${item.isRead ? "font-semibold" : "font-bold"}`}>{item.title}</Text>
                    <Text className="text-gray-600 text-sm mt-0.5">{item.body}</Text>
                    <Text className="text-gray-500 text-xs mt-1">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                  {!item.isRead && <View className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 ml-2" />}
                </View>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} className="w-full h-40 rounded-xl mt-3" resizeMode="cover" />
                ) : null}
              </Card>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

export default NotificationScreen;
