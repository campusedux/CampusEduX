import React from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen, PressableScale, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useMySubmissions } from "@/hooks/usePractice";
import { useAuthStore } from "@/store/authStore";
import { CARD_SHADOW } from "@/constants/theme";
import { PRACTICE_LANGUAGE_LABEL } from "@/types/practice.types";
import type { HomeStackParamList } from "@/types";
import { PracticeHeader, VerdictPill, relativeDate } from "./practiceUi";

type Nav = NativeStackNavigationProp<HomeStackParamList, "PracticeSubmissions">;

export function PracticeSubmissionsScreen() {
  const navigation = useNavigation<Nav>();
  const userId = useAuthStore((s) => s.user?.id);
  const q = useMySubmissions(userId);
  const rows = q.data?.pages.flatMap((p) => p.rows) ?? [];

  return (
    <Screen>
      <PracticeHeader title="Submissions" onBack={() => navigation.goBack()} />
      {!userId ? (
        <EmptyState
          icon="log-in-outline"
          title="Sign in to see your submissions"
          subtitle="Every solution you submit from a practice problem is saved here."
        />
      ) : q.isLoading ? (
        <LoadingState label="Loading submissions..." />
      ) : q.isError ? (
        <ErrorState message="Couldn't load your submissions." onRetry={() => q.refetch()} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          className="px-6"
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching && !q.isFetchingNextPage}
              onRefresh={() => q.refetch()}
              tintColor="#4F39F6"
            />
          }
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <EmptyState
              icon="time-outline"
              title="No submissions yet"
              subtitle="Open a practice problem, write a solution and press Submit — it will show up here."
            />
          }
          ListFooterComponent={q.isFetchingNextPage ? <LoadingState label="Loading more..." /> : null}
          renderItem={({ item }) => (
            <PressableScale
              onPress={() => navigation.navigate("PracticeSubmission", { id: item.id })}
              className="bg-white rounded-2xl border border-gray-100 p-4 mb-3"
              style={CARD_SHADOW}
            >
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 font-bold text-gray-900 mr-2" numberOfLines={1}>
                  {item.problem_slug.replace(/-/g, " ")}
                </Text>
                <VerdictPill verdict={item.verdict} />
              </View>
              <Text className="text-gray-500 text-xs mt-2">
                {PRACTICE_LANGUAGE_LABEL[item.language] ?? item.language} · {item.passed}/{item.total} tests
                {item.runtime_ms != null ? ` · ${item.runtime_ms} ms` : ""} · {relativeDate(item.created_at)}
              </Text>
            </PressableScale>
          )}
        />
      )}
    </Screen>
  );
}

export default PracticeSubmissionsScreen;
