import React, { useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { confirmAction } from "@/lib/notify";
import { useResumeList, useDeleteResume } from "@/hooks/useResume";
import type { ResumeStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<ResumeStackParamList, "ResumeHistory">;
type Filter = "all" | "created" | "shared";
const FILTER_LABELS: Record<Filter, string> = { all: "All", created: "Created by Me", shared: "Shared with Me" };

export function ResumeHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useResumeList();
  const deleteResume = useDeleteResume();
  const [filter, setFilter] = useState<Filter>("all");

  const confirmDelete = (id: string, title: string) => {
    confirmAction("Delete Resume", `Are you sure you want to delete "${title}"?`, () => deleteResume.mutate(id), "Delete");
  };

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Resume History</Text>
      </View>

      <View className="flex-row mb-4" style={{ gap: 8 }}>
        {(["all", "created", "shared"] as Filter[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            className="px-4 py-2 rounded-full border"
            style={{ backgroundColor: filter === f ? "#4F39F6" : "#fff", borderColor: filter === f ? "#4F39F6" : "#E5E7EB" }}
          >
            <Text className={filter === f ? "text-white font-medium text-xs" : "text-gray-600 text-xs"}>{FILTER_LABELS[f]}</Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <LoadingState label="Loading history..." />
      ) : isError ? (
        <ErrorState message="Couldn't load resume history." onRetry={refetch} />
      ) : filter === "shared" ? (
        <EmptyState icon="share-social-outline" title="No shared resumes" subtitle="Resumes shared with you will appear here." />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="document-text-outline" title="No resumes yet" subtitle="Create your first resume to see it here." />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => (navigation as any).navigate("ResumeEditor", { resumeId: item.id })}
              className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 mb-3"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
                  <Ionicons name="document-text-outline" size={18} color="#4F39F6" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900" numberOfLines={1}>{item.title}</Text>
                  <Text className="text-gray-400 text-xs mt-0.5">
                    Updated {new Date(item.updatedAt).toLocaleDateString()} · {new Date(item.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <View className="bg-green-50 rounded-full px-2.5 py-1 mb-2">
                  <Text className="text-green-700 text-xs font-semibold">ATS {item.atsScore}%</Text>
                </View>
                <Ionicons name="trash-outline" size={16} color="#DC2626" onPress={() => confirmDelete(item.id, item.title)} />
              </View>
            </Pressable>
          )}
        />
      )}

      <Button label="Create New Resume" onPress={() => (navigation as any).navigate("Templates", undefined)} className="mt-2 mb-6" />
    </Screen>
  );
}

export default ResumeHistoryScreen;
