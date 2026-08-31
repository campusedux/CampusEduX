import React, { useMemo, useState } from "react";
import { View, Text, Pressable, FlatList, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useAppliedJobs } from "@/hooks/useJobs";
import type { JobStackParamList, JobApplication } from "@/types";

type Nav = NativeStackNavigationProp<JobStackParamList, "AppliedJobs">;
type SortMode = "all" | "recent" | "oldest";

const STATUS_STYLES: Record<JobApplication["overallStatus"], { label: string; bg: string; text: string }> = {
  in_review: { label: "In Review", bg: "#FEF3C7", text: "#92400E" },
  shortlisted: { label: "Shortlisted", bg: "#DBEAFE", text: "#1E40AF" },
  rejected: { label: "Rejected", bg: "#FEE2E2", text: "#991B1B" },
  hired: { label: "Hired", bg: "#DCFCE7", text: "#166534" },
};

export function AppliedJobsScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useAppliedJobs();
  const [sortMode, setSortMode] = useState<SortMode>("all");

  const sorted = useMemo(() => {
    if (!data) return [];
    const copy = [...data];
    if (sortMode === "recent") copy.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
    if (sortMode === "oldest") copy.sort((a, b) => new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime());
    return copy;
  }, [data, sortMode]);

  return (
    <Screen className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">Applied Jobs</Text>
        </View>
        <Text className="text-gray-400 text-sm">{data?.length ?? 0}</Text>
      </View>

      <View className="flex-row mb-4" style={{ gap: 8 }}>
        {(["all", "recent", "oldest"] as SortMode[]).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setSortMode(mode)}
            className="px-4 py-2 rounded-full border"
            style={{ backgroundColor: sortMode === mode ? "#4F39F6" : "#fff", borderColor: sortMode === mode ? "#4F39F6" : "#E5E7EB" }}
          >
            <Text className={sortMode === mode ? "text-white font-medium capitalize" : "text-gray-600 capitalize"}>{mode}</Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <LoadingState label="Loading applications..." />
      ) : isError ? (
        <ErrorState message="Couldn't load applications." onRetry={refetch} />
      ) : sorted.length === 0 ? (
        <EmptyState icon="document-text-outline" title="No applications yet" subtitle="Jobs you apply to will show up here." />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const style = STATUS_STYLES[item.overallStatus];
            return (
              <Pressable
                onPress={() => (navigation as any).navigate("ApplicationStatus", { applicationId: item.id })}
                className="flex-row items-center border border-gray-100 rounded-2xl p-3 mb-3"
              >
                <View className="w-11 h-11 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
                  {item.job.companyLogoUrl ? (
                    <Image source={{ uri: item.job.companyLogoUrl }} className="w-full h-full rounded-xl" resizeMode="cover" />
                  ) : (
                    <Ionicons name="business-outline" size={20} color="#4F39F6" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900" numberOfLines={1}>{item.job.title}</Text>
                  <Text className="text-gray-400 text-xs mt-0.5">
                    {item.job.companyName} · Applied on {new Date(item.appliedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: style.bg }}>
                  <Text className="text-[11px] font-semibold" style={{ color: style.text }}>{style.label}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

export default AppliedJobsScreen;
