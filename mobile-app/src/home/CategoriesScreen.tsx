import React from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { CategoryCard } from "@/components/cards";
import { useCategories } from "@/hooks/useHomeData";
import type { HomeStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<HomeStackParamList, "AllCategories">;

export function CategoriesScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useCategories();

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">All Categories</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading categories..." />
      ) : isError ? (
        <ErrorState message="Couldn't load categories." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No categories yet" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          renderItem={({ item }) => (
            <CategoryCard
              category={item}
              onPress={(category) =>
                navigation
                  .getParent()
                  ?.navigate("Projects", { screen: "CategoryProjects", params: { categoryId: category.id, categoryName: category.name } })
              }
            />
          )}
        />
      )}
    </Screen>
  );
}

export default CategoriesScreen;
