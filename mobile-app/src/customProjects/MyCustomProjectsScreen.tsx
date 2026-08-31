import React from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState, Button, PressableScale } from "@/components/ui";
import { CARD_SHADOW } from "@/constants/theme";
import { useMyCustomProjects } from "@/hooks/useCustomProjects";
import { rupees } from "./components/wizard";
import {
  CUSTOM_PROJECT_PROGRESS,
  CUSTOM_STATUS_LABELS,
  type CustomProjectRequest,
  type CustomProjectsStackParamList,
} from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "MyCustomProjects">;

const STATUS_TINT: Record<string, { bg: string; fg: string }> = {
  new: { bg: "#EEF0FF", fg: "#4F39F6" },
  in_development: { bg: "#E0F2FE", fg: "#0369A1" },
  testing: { bg: "#FEF9C3", fg: "#A16207" },
  ready: { bg: "#DCFCE7", fg: "#15803D" },
  delivered: { bg: "#DCFCE7", fg: "#15803D" },
  cancelled: { bg: "#FEE2E2", fg: "#B91C1C" },
};

function RequestCard({ item, onPress }: { item: CustomProjectRequest; onPress: () => void }) {
  const tint = STATUS_TINT[item.status] ?? STATUS_TINT.new;
  const pct = CUSTOM_PROJECT_PROGRESS[item.status] ?? 0;
  return (
    <PressableScale onPress={onPress} className="rounded-2xl bg-white p-4 mb-3" style={CARD_SHADOW}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="font-semibold text-gray-900" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-gray-400 text-xs mt-0.5 font-mono">{item.requestCode}</Text>
        </View>
        <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: tint.bg }}>
          <Text className="text-xs font-semibold" style={{ color: tint.fg }}>
            {CUSTOM_STATUS_LABELS[item.status]}
          </Text>
        </View>
      </View>

      <Text className="text-gray-400 text-xs mt-2">
        {item.projectType[0].toUpperCase() + item.projectType.slice(1)} · {item.projectLevel}
      </Text>

      <View className="h-1.5 rounded-full bg-gray-100 overflow-hidden mt-3">
        <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: tint.fg }} />
      </View>

      <View className="flex-row justify-between mt-3">
        <Text className="text-gray-500 text-sm">Est. {rupees(item.estimatedTotal)}</Text>
        <Text className="text-gray-700 text-sm font-medium">Token paid {rupees(item.tokenAmount)}</Text>
      </View>
    </PressableScale>
  );
}

export function MyCustomProjectsScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch, isRefetching } = useMyCustomProjects();

  return (
    <Screen className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} className="mr-3">
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">My Custom Projects</Text>
        </View>
        <Pressable onPress={() => navigation.navigate("BuilderStart")} hitSlop={8}>
          <Ionicons name="add-circle" size={26} color="#4F39F6" />
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingState label="Loading your projects…" />
      ) : isError ? (
        <ErrorState message="Couldn't load your custom projects." onRetry={refetch} />
      ) : (data ?? []).length === 0 ? (
        <View className="flex-1 justify-center">
          <EmptyState
            icon="construct-outline"
            title="No custom projects yet"
            subtitle="Configure a project and pay the token to get started."
          />
          <Button label="Start a build" onPress={() => navigation.navigate("BuilderStart")} className="mt-4" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => (
            <RequestCard
              item={item}
              onPress={() => navigation.navigate("CustomProjectDetail", { requestId: item.id })}
            />
          )}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </Screen>
  );
}

export default MyCustomProjectsScreen;
