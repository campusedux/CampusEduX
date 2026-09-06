import React from "react";
import { View, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState, DrawerMenuButton, PressableScale } from "@/components/ui";
import { useLearningGrids } from "@/hooks/useLearning";
import { useAuthStore } from "@/store/authStore";
import { CARD_SHADOW } from "@/constants/theme";
import type { LearningGridCard, PlacementStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<PlacementStackParamList, "PlacementHome">;

/**
 * The "Learning" home (bottom-tab "Prep" — internal route name kept for deep
 * links). The grid list is 100% DB-driven: `learning_grids_list('mobile')`
 * returns every published, mobile-visible, audience-matching grid in the
 * admin-defined order. A grid the admin creates + publishes appears here on the
 * next refresh with NO app update. Every grid opens the same Grid → Section →
 * Topic → Content tree (`LearningGrid`). There is no sample/demo fallback — a
 * failed load shows a real error + retry.
 */
const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  content: "book-outline",
  custom: "sparkles-outline",
};

function isEmoji(s: string | null): s is string {
  return !!s && /\p{Extended_Pictographic}/u.test(s);
}

export function PlacementHomeScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const grids = useLearningGrids();

  const openGrid = (grid: LearningGridCard) => {
    navigation.navigate("LearningGrid", { gridSlug: grid.slug, gridName: grid.name });
  };

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-5">
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <DrawerMenuButton />
          <View>
            <Text className="text-xl font-bold text-gray-900">Learning</Text>
            <Text className="text-gray-500 text-sm mt-0.5">
              Hi {user?.fullName?.split(" ")[0] || "there"}, let&apos;s keep going!
            </Text>
          </View>
        </View>
        <PressableScale onPress={() => navigation.navigate("LearningGrids")} hitSlop={8}>
          <Ionicons name="search-outline" size={24} color="#111827" />
        </PressableScale>
      </View>

      <View className="rounded-2xl p-5 mb-6" style={{ backgroundColor: "#4F39F6" }}>
        <Text className="text-white font-bold text-base mb-1">Stay Consistent</Text>
        <Text className="text-indigo-100 text-sm">Keep learning! You&apos;ll make it!</Text>
      </View>

      <Text className="font-bold text-gray-900 mb-3">Explore Learning</Text>
      {grids.isLoading ? (
        <LoadingState label="Loading learning areas..." />
      ) : grids.isError ? (
        <ErrorState message="Couldn't load learning areas." onRetry={() => grids.refetch()} />
      ) : !grids.data || grids.data.length === 0 ? (
        <EmptyState
          icon="school-outline"
          title="Nothing here yet"
          subtitle="Learning areas appear here as soon as they're published from the admin panel."
        />
      ) : (
        <View className="flex-row flex-wrap justify-between">
          {grids.data.map((grid) => (
            <GridCard key={grid.id} grid={grid} onPress={() => openGrid(grid)} />
          ))}
        </View>
      )}

      <View className="h-6" />
    </Screen>
  );
}

function GridCard({ grid, onPress }: { grid: LearningGridCard; onPress: () => void }) {
  const tint = grid.accent_color || "#4F39F6";
  return (
    <PressableScale
      onPress={onPress}
      className="bg-white border border-gray-100 rounded-2xl p-4 mb-3 items-center"
      style={{ width: "48%", ...CARD_SHADOW }}
    >
      <View className="w-12 h-12 rounded-2xl items-center justify-center mb-2" style={{ backgroundColor: `${tint}1A` }}>
        {isEmoji(grid.icon) ? (
          <Text style={{ fontSize: 22 }}>{grid.icon}</Text>
        ) : (
          <Ionicons name={TYPE_ICON[grid.grid_type] ?? "book-outline"} size={24} color={tint} />
        )}
      </View>
      <View className="flex-row items-center" style={{ gap: 4 }}>
        <Text className="font-semibold text-gray-900 text-sm text-center" numberOfLines={2}>
          {grid.name}
        </Text>
        {grid.is_premium ? <Ionicons name="lock-closed" size={11} color="#B45309" /> : null}
      </View>
      {grid.topic_count > 0 ? (
        <Text className="text-gray-400 text-[11px] mt-0.5">
          {grid.topic_count} topic{grid.topic_count === 1 ? "" : "s"}
        </Text>
      ) : null}
    </PressableScale>
  );
}

export default PlacementHomeScreen;
