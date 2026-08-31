import React, { useMemo, useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { usePurchaseHistory } from "@/hooks/useProfile";
import type { PurchaseHistoryType } from "@/types";

type Tab = "all" | PurchaseHistoryType;

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "project", label: "Projects" },
  { key: "course", label: "Courses" },
  { key: "test", label: "Tests" },
];

const TYPE_ICON: Record<PurchaseHistoryType, keyof typeof Ionicons.glyphMap> = {
  project: "cube-outline",
  course: "school-outline",
  test: "document-text-outline",
};

export function PurchaseHistoryScreen() {
  const navigation = useNavigation();
  const { data, isLoading, isError, refetch } = usePurchaseHistory();
  const [tab, setTab] = useState<Tab>("all");

  const filtered = useMemo(() => {
    if (!data) return [];
    return tab === "all" ? data : data.filter((item) => item.type === tab);
  }, [data, tab]);

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Purchase History</Text>
      </View>

      <View className="flex-row mb-4" style={{ gap: 8 }}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            className="px-4 py-2 rounded-full border"
            style={{ backgroundColor: tab === t.key ? "#4F39F6" : "#fff", borderColor: tab === t.key ? "#4F39F6" : "#E5E7EB" }}
          >
            <Text className={tab === t.key ? "text-white font-medium" : "text-gray-600"}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <LoadingState label="Loading purchase history..." />
      ) : isError ? (
        <ErrorState message="Couldn't load purchase history." onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No purchases yet"
          subtitle={tab === "all" ? "Your orders will show up here." : `No ${tab} purchases yet.`}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="flex-row items-center border border-gray-100 rounded-2xl p-4 mb-3">
              <View className="w-11 h-11 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
                <Ionicons name={TYPE_ICON[item.type]} size={20} color="#4F39F6" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900" numberOfLines={1}>{item.title}</Text>
                <Text className="text-gray-400 text-xs mt-0.5 capitalize">{item.type}</Text>
                <Text className="text-gray-400 text-xs">{new Date(item.purchasedAt).toLocaleDateString()}</Text>
              </View>
              <View className="items-end">
                <Text className="font-bold text-gray-900">₹{item.amount}</Text>
                <View className={`rounded-full px-2 py-0.5 mt-1 ${item.status === "completed" ? "bg-green-50" : "bg-amber-50"}`}>
                  <Text className={`text-[10px] font-semibold ${item.status === "completed" ? "text-green-700" : "text-amber-700"}`}>
                    {item.status === "completed" ? "Completed" : item.status}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

export default PurchaseHistoryScreen;
