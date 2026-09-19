import React, { useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, ScrollView, Pressable, RefreshControl } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Chip, PressableScale, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { usePracticeCategories, usePracticeProblems } from "@/hooks/usePractice";
import { CARD_SHADOW } from "@/constants/theme";
import { PRACTICE_DIFFICULTIES, PRACTICE_LANGUAGE_LABEL, type PracticeDifficulty } from "@/types/practice.types";
import type { HomeStackParamList } from "@/types";
import { DifficultyPill, PracticeHeader } from "./practiceUi";

type Nav = NativeStackNavigationProp<HomeStackParamList, "PracticeProblems">;
type Rte = RouteProp<HomeStackParamList, "PracticeProblems">;

export function PracticeProblemsScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const [category, setCategory] = useState<string | null>(params?.category ?? null);
  const [difficulty, setDifficulty] = useState<PracticeDifficulty | null>(null);
  const [text, setText] = useState("");
  const [q, setQ] = useState("");

  // Debounce the search box so we don't fire an RPC per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 350);
    return () => clearTimeout(t);
  }, [text]);

  const categories = usePracticeCategories();
  const problems = usePracticeProblems({ category, difficulty, q });
  const items = problems.data?.pages.flatMap((p) => p.items) ?? [];
  const total = problems.data?.pages[0]?.total ?? 0;

  return (
    <Screen>
      <PracticeHeader title="Coding Problems" onBack={() => navigation.goBack()} />
      <View className="px-6">
        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 mb-3" style={{ height: 46 }}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-gray-900"
            placeholder="Search problems..."
            placeholderTextColor="#9CA3AF"
            value={text}
            onChangeText={setText}
            returnKeyType="search"
            autoCorrect={false}
          />
          {text ? (
            <Pressable onPress={() => setText("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Chip label="All levels" active={difficulty === null} onPress={() => setDifficulty(null)} />
          {PRACTICE_DIFFICULTIES.map((d) => (
            <Chip key={d} label={d} active={difficulty === d} onPress={() => setDifficulty(difficulty === d ? null : d)} />
          ))}
        </ScrollView>
        {(categories.data ?? []).length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Chip label="All topics" active={category === null} onPress={() => setCategory(null)} />
            {(categories.data ?? []).map((c) => (
              <Chip
                key={c.slug}
                label={c.name}
                active={category === c.slug}
                onPress={() => setCategory(category === c.slug ? null : c.slug)}
              />
            ))}
          </ScrollView>
        ) : null}
      </View>

      {problems.isLoading ? (
        <LoadingState label="Loading problems..." />
      ) : problems.isError ? (
        <ErrorState message="Couldn't load problems." onRetry={() => problems.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.slug}
          className="px-6"
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={problems.isRefetching && !problems.isFetchingNextPage}
              onRefresh={() => problems.refetch()}
              tintColor="#4F39F6"
            />
          }
          onEndReached={() => problems.hasNextPage && !problems.isFetchingNextPage && problems.fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            items.length > 0 ? (
              <Text className="text-gray-500 text-sm mb-3">
                {total} problem{total === 1 ? "" : "s"} found
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="code-slash-outline"
              title="No problems found"
              subtitle="Try a different search, difficulty or topic."
            />
          }
          ListFooterComponent={problems.isFetchingNextPage ? <LoadingState label="Loading more..." /> : null}
          renderItem={({ item }) => (
            <PressableScale
              onPress={() => navigation.navigate("PracticeProblem", { slug: item.slug, title: item.title })}
              className="bg-white rounded-2xl border border-gray-100 p-4 mb-3"
              style={CARD_SHADOW}
            >
              <View className="flex-row items-start">
                <Text className="flex-1 font-bold text-gray-900" numberOfLines={2}>
                  {item.title}
                </Text>
                {item.is_premium ? <Ionicons name="lock-closed" size={14} color="#B45309" style={{ marginLeft: 6, marginTop: 3 }} /> : null}
              </View>
              <View className="flex-row items-center flex-wrap mt-2" style={{ gap: 8 }}>
                <DifficultyPill difficulty={item.difficulty} />
                <Text className="text-gray-500 text-xs">{item.category_name}</Text>
              </View>
              {item.supported_languages?.length ? (
                <Text className="text-gray-400 text-[11px] mt-2" numberOfLines={1}>
                  {item.supported_languages.map((l) => PRACTICE_LANGUAGE_LABEL[l] ?? l).join(" · ")}
                </Text>
              ) : null}
            </PressableScale>
          )}
        />
      )}
    </Screen>
  );
}

export default PracticeProblemsScreen;
