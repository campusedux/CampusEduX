import React, { useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, Chip, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { usePracticeTests } from "@/hooks/usePlacement";
import type { PlacementStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<PlacementStackParamList, "PracticeTestList">;
type Rte = RouteProp<PlacementStackParamList, "PracticeTestList">;

const FILTERS = ["all", "aptitude", "verbal", "logical"] as const;

export function PracticeTestListScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>((params?.category as any) ?? "all");
  const { data, isLoading, isError, refetch } = usePracticeTests(filter === "all" ? {} : { category: filter });

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Practice Tests</Text>
      </View>

      <View className="flex-row flex-wrap mb-4">
        {FILTERS.map((f) => (
          <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>

      {isLoading ? (
        <LoadingState label="Loading tests..." />
      ) : isError ? (
        <ErrorState message="Couldn't load tests." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="document-text-outline" title="No practice tests found" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="border border-gray-100 rounded-2xl p-4 mb-3">
              <Text className="font-semibold text-gray-900 mb-1">{item.title}</Text>
              <Text className="text-gray-400 text-xs mb-3">
                {item.questionCount} Questions · {item.durationMinutes} mins
              </Text>
              <Button label="Start Test" onPress={() => (navigation as any).navigate("TestInstruction", { testId: item.id })} />
            </View>
          )}
        />
      )}
    </Screen>
  );
}

export default PracticeTestListScreen;
