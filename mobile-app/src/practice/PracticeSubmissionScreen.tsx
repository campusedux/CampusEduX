import React from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { Screen, Button, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { notify } from "@/lib/notify";
import { useSubmission } from "@/hooks/usePractice";
import { PRACTICE_LANGUAGE_LABEL } from "@/types/practice.types";
import type { HomeStackParamList } from "@/types";
import { CodeEditor } from "./CodeParts";
import { PracticeHeader, VerdictPill, relativeDate } from "./practiceUi";

type Nav = NativeStackNavigationProp<HomeStackParamList, "PracticeSubmission">;
type Rte = RouteProp<HomeStackParamList, "PracticeSubmission">;

export function PracticeSubmissionScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { data, isLoading, isError, refetch, isRefetching } = useSubmission(params.id);

  const copy = async () => {
    if (!data) return;
    await Clipboard.setStringAsync(data.source_code);
    notify("Copied", "Your code was copied to the clipboard.");
  };

  return (
    <Screen>
      <PracticeHeader title="Submission" onBack={() => navigation.goBack()} />
      {isLoading ? (
        <LoadingState label="Loading submission..." />
      ) : isError ? (
        <ErrorState message="Couldn't load this submission." onRetry={() => refetch()} />
      ) : !data ? (
        <EmptyState icon="document-outline" title="Submission not found" />
      ) : (
        <ScrollView
          className="px-6"
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#4F39F6" />}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="flex-1 text-[17px] font-bold text-gray-900 mr-2" numberOfLines={2}>
              {data.problem_slug.replace(/-/g, " ")}
            </Text>
            <VerdictPill verdict={data.verdict} />
          </View>
          <Text className="text-gray-500 text-xs mb-4">
            {PRACTICE_LANGUAGE_LABEL[data.language] ?? data.language} · {data.passed}/{data.total} tests
            {data.runtime_ms != null ? ` · ${data.runtime_ms} ms` : ""}
            {data.memory_kb != null ? ` · ${data.memory_kb} KB` : ""} · {relativeDate(data.created_at)}
          </Text>

          <CodeEditor value={data.source_code} editable={false} minHeight={160} />

          <Button label="Copy code" variant="outline" leftIcon="copy-outline" onPress={copy} className="mt-4" />
          <Pressable
            onPress={() => navigation.navigate("PracticeProblem", { slug: data.problem_slug })}
            className="mt-4 items-center"
          >
            <Text className="text-primary font-medium">Open problem</Text>
          </Pressable>
        </ScrollView>
      )}
    </Screen>
  );
}

export default PracticeSubmissionScreen;
