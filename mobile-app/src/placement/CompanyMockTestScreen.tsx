import React from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { usePracticeTests } from "@/hooks/usePlacement";
import type { PlacementStackParamList } from "@/types";

type Rte = RouteProp<PlacementStackParamList, "CompanyMockTest">;

export function CompanyMockTestScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data, isLoading, isError, refetch } = usePracticeTests({ companyId: params.companyId });

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Company Mock Test</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading mock tests..." />
      ) : isError ? (
        <ErrorState message="Couldn't load mock tests." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="document-text-outline" title="No mock tests available yet" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="border border-gray-100 rounded-2xl p-4 mb-3">
              <Text className="font-semibold text-gray-900 mb-1">{item.title}</Text>
              <Text className="text-gray-400 text-xs mb-1">
                Total Questions: {item.questionCount} · Total Time: {item.durationMinutes} Minutes
              </Text>
              {item.description ? <Text className="text-gray-500 text-xs mb-3">{item.description}</Text> : <View className="mb-2" />}
              <Button label="Start Mock Test" onPress={() => (navigation as any).navigate("TestInstruction", { testId: item.id })} />
            </View>
          )}
        />
      )}
    </Screen>
  );
}

export default CompanyMockTestScreen;
