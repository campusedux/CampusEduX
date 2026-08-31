import React, { useState } from "react";
import { View, Text, Pressable, TextInput, FlatList, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useCompanies } from "@/hooks/useJobs";
import type { JobStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<JobStackParamList, "CompanyList">;

export function CompanyListScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState("");
  const { data, isLoading, isError, refetch } = useCompanies(query);

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Companies</Text>
      </View>

      <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 mb-4" style={{ height: 44 }}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          className="flex-1 ml-2 text-gray-900"
          value={query}
          onChangeText={setQuery}
          placeholder="Search company"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <Text className="text-gray-400 text-sm mb-2">Top Companies</Text>

      {isLoading ? (
        <LoadingState label="Loading companies..." />
      ) : isError ? (
        <ErrorState message="Couldn't load companies." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="business-outline" title="No companies found" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => (navigation as any).navigate("CompanyDetails", { companyId: item.id })}
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
              <View className="flex-row items-center">
                <Text className="text-gray-400 text-sm mr-2">{item.openJobsCount} Jobs</Text>
                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

export default CompanyListScreen;
