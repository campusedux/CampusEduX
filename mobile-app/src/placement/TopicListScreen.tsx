import React from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useDSAProblems } from "@/hooks/usePlacement";
import type { PlacementStackParamList, Difficulty } from "@/types";

type Nav = NativeStackNavigationProp<PlacementStackParamList, "TopicList">;
type Rte = RouteProp<PlacementStackParamList, "TopicList">;

const DIFFICULTY_COLOR: Record<Difficulty, string> = { Easy: "#16A34A", Medium: "#F59E0B", Hard: "#DC2626" };

export function TopicListScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { data, isLoading, isError, refetch } = useDSAProblems(params.topicId);

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Problems</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading problems..." />
      ) : isError ? (
        <ErrorState message="Couldn't load problems." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No problems in this topic yet" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => (navigation as any).navigate("ProblemDetails", { problemId: item.id })}
              className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 mb-3"
            >
              <View className="flex-row items-center flex-1">
                <Text className="text-gray-400 w-6">{index + 1}.</Text>
                <Text className="font-medium text-gray-900 flex-1" numberOfLines={1}>{item.title}</Text>
              </View>
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <Text className="text-xs font-semibold" style={{ color: DIFFICULTY_COLOR[item.difficulty] }}>{item.difficulty}</Text>
                {item.isSolved && <Ionicons name="checkmark-circle" size={16} color="#16A34A" />}
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

export default TopicListScreen;
