import React from "react";
import { FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen, ScreenHeader, SkeletonLoader, ErrorState, EmptyState } from "@/components/ui";
import { CategoryCard } from "@/components/cards";
import { ACCENTS, AccentName } from "@/constants/theme";
import { useCategories } from "@/hooks/useHomeData";
import type { HomeStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<HomeStackParamList, "AllCategories">;

/** Cycled per tile so the grid reads like the Home category tiles. */
const TILE_ACCENTS = Object.keys(ACCENTS) as AccentName[];

export function CategoriesScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useCategories();
  const count = data?.length ?? 0;

  return (
    <Screen className="px-6">
      <ScreenHeader
        title="All Categories"
        subtitle={count > 0 ? `${count} categor${count === 1 ? "y" : "ies"}` : undefined}
        onBack={() => navigation.goBack()}
      />

      {isLoading ? (
        <SkeletonLoader count={5} />
      ) : isError ? (
        <ErrorState message="Couldn't load categories." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="grid-outline" title="No categories yet" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          renderItem={({ item, index }) => (
            <CategoryCard
              category={item}
              accent={TILE_ACCENTS[index % TILE_ACCENTS.length]}
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
