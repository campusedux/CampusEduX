import React from "react";
import { View, Text, Pressable, FlatList, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { usePlacementCompanies } from "@/hooks/usePlacement";
import type { PlacementStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<PlacementStackParamList, "CompanyList">;

export function CompanyListScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = usePlacementCompanies();

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Company Specific</Text>
      </View>

      <Text className="text-gray-400 text-sm mb-3">Top Companies</Text>

      {isLoading ? (
        <LoadingState label="Loading companies..." />
      ) : isError ? (
        <ErrorState message="Couldn't load companies." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="business-outline" title="No company prep available yet" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => (navigation as any).navigate("CompanyDashboard", { companyId: item.id })}
              className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 mb-3"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-11 h-11 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
                  {item.logoUrl ? (
                    <Image source={{ uri: item.logoUrl }} className="w-full h-full rounded-xl" resizeMode="cover" />
                  ) : (
                    <Ionicons name="business-outline" size={20} color="#4F39F6" />
                  )}
                </View>
                <Text className="font-semibold text-gray-900 flex-1" numberOfLines={1}>{item.name}</Text>
              </View>
              <Text className="text-gray-400 text-sm mr-2">{item.questionsCount} Questions</Text>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

export default CompanyListScreen;
