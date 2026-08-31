import React from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useDownloadHistory } from "@/hooks/useProjects";

export function DownloadHistoryScreen() {
  const navigation = useNavigation();
  const { data, isLoading, isError, refetch } = useDownloadHistory();

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Download History</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading download history..." />
      ) : isError ? (
        <ErrorState message="Couldn't load download history." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="download-outline" title="No downloads yet" subtitle="Files you download will be listed here." />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="flex-row items-center border border-gray-100 rounded-2xl p-3 mb-3">
              <View className="w-11 h-11 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
                <Ionicons name="document-outline" size={20} color="#4F39F6" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900" numberOfLines={1}>{item.projectTitle}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">
                  {item.fileLabel} · {item.fileSizeMB.toFixed(1)} MB
                </Text>
              </View>
              <Text className="text-gray-400 text-xs">{new Date(item.downloadedAt).toLocaleDateString()}</Text>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

export default DownloadHistoryScreen;
