import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import Slider from "@react-native-community/slider";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen, Button, Chip } from "@/components/ui";
import { useCategories } from "@/hooks/useHomeData";
import { useProjectFilterStore } from "@/store/projectFilterStore";
import { DEFAULT_PROJECT_FILTERS } from "@/types";
import type { ProjectStackParamList, ProjectFilters } from "@/types";

type Nav = NativeStackNavigationProp<ProjectStackParamList, "FilterProjects">;

const RATINGS = [3.5, 4.0, 4.5];
const SORTS: { label: string; value: ProjectFilters["sortBy"] }[] = [
  { label: "Relevance", value: "relevance" },
  { label: "Latest", value: "latest" },
  { label: "Price", value: "price" },
];
const TECHNOLOGIES = ["React", "Node.js", "PHP", "Laravel", "Python", "Java", "Flutter"];

export function FilterProjectsScreen() {
  const navigation = useNavigation<Nav>();
  const { data: categories } = useCategories();
  const { filters, setFilters, resetFilters } = useProjectFilterStore();
  const [draft, setDraft] = useState<ProjectFilters>(filters);

  const toggleTech = (tech: string) => {
    setDraft((d) => ({
      ...d,
      technologies: d.technologies.includes(tech) ? d.technologies.filter((t) => t !== tech) : [...d.technologies, tech],
    }));
  };

  const applyFilters = () => {
    setFilters(draft);
    navigation.goBack();
  };

  const reset = () => {
    setDraft(DEFAULT_PROJECT_FILTERS);
    resetFilters();
  };

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <Text className="text-lg font-bold text-gray-900">Filter</Text>
        <Pressable onPress={reset}>
          <Text className="text-primary font-medium">Reset</Text>
        </Pressable>
      </View>

      <Text className="font-semibold text-gray-900 mb-2">Categories</Text>
      <View className="flex-row flex-wrap mb-4">
        <Chip label="All" active={!draft.categoryId} onPress={() => setDraft((d) => ({ ...d, categoryId: null }))} />
        {(categories ?? []).map((c) => (
          <Chip key={c.id} label={c.name} active={draft.categoryId === c.id} onPress={() => setDraft((d) => ({ ...d, categoryId: c.id }))} />
        ))}
      </View>

      <Text className="font-semibold text-gray-900 mb-2">
        Price Range: ₹{draft.minPrice} - ₹{draft.maxPrice === 1000 ? "1000+" : draft.maxPrice}
      </Text>
      <Slider
        minimumValue={0}
        maximumValue={1000}
        step={50}
        value={draft.maxPrice}
        minimumTrackTintColor="#4F39F6"
        onValueChange={(value: number) => setDraft((d) => ({ ...d, maxPrice: value }))}
        style={{ marginBottom: 20 }}
      />

      <Text className="font-semibold text-gray-900 mb-2">Ratings</Text>
      <View className="flex-row flex-wrap mb-4">
        {RATINGS.map((r) => (
          <Chip key={r} label={`${r}+`} active={draft.minRating === r} onPress={() => setDraft((d) => ({ ...d, minRating: d.minRating === r ? null : r }))} />
        ))}
      </View>

      <Text className="font-semibold text-gray-900 mb-2">Technologies</Text>
      <View className="flex-row flex-wrap mb-4">
        {TECHNOLOGIES.map((tech) => (
          <Chip key={tech} label={tech} active={draft.technologies.includes(tech)} onPress={() => toggleTech(tech)} />
        ))}
      </View>

      <Text className="font-semibold text-gray-900 mb-2">Sort By</Text>
      <View className="flex-row flex-wrap mb-8">
        {SORTS.map((s) => (
          <Chip key={s.value} label={s.label} active={draft.sortBy === s.value} onPress={() => setDraft((d) => ({ ...d, sortBy: s.value }))} />
        ))}
      </View>

      <Button label="Apply Filters" onPress={applyFilters} />
    </Screen>
  );
}

export default FilterProjectsScreen;
