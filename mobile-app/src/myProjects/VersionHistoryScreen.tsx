import React from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useVersionHistory } from "@/hooks/useMyProjects";
import type { MyProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<MyProjectsStackParamList, "VersionHistory">;
type Rte = RouteProp<MyProjectsStackParamList, "VersionHistory">;

export function VersionHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { data: versions, isLoading, isError, refetch } = useVersionHistory(params.projectId);

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Version History</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading version history..." />
      ) : isError ? (
        <ErrorState message="Couldn't load version history." onRetry={refetch} />
      ) : !versions || versions.length === 0 ? (
        <EmptyState icon="time-outline" title="No version history yet" />
      ) : (
        <FlatList
          data={versions}
          keyExtractor={(item) => item.version}
          renderItem={({ item, index }) => (
            <View className="flex-row">
              <View className="items-center mr-3" style={{ width: 16 }}>
                <View className="w-3 h-3 rounded-full" style={{ backgroundColor: item.isLatest ? "#16A34A" : "#D1D5DB" }} />
                {index < versions.length - 1 && <View className="w-0.5 flex-1 bg-gray-200 my-1" />}
              </View>
              <View className="flex-1 mb-6">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center">
                    <Text className="font-bold text-gray-900 mr-2">v{item.version}</Text>
                    {item.isLatest && (
                      <View className="bg-primary rounded-full px-2 py-0.5">
                        <Text className="text-white text-[10px] font-semibold">Latest</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-gray-400 text-xs">{item.sizeMB.toFixed(0)} MB</Text>
                </View>
                <Text className="text-gray-400 text-xs mb-2">{new Date(item.releasedAt).toLocaleDateString()}</Text>
                {item.changelog.map((line) => (
                  <Text key={line} className="text-gray-500 text-sm mb-0.5">
                    • {line}
                  </Text>
                ))}
                {item.isLatest && (
                  <Pressable
                    onPress={() => (navigation as any).navigate("DownloadFiles", { projectId: params.projectId })}
                    className="flex-row items-center mt-2"
                  >
                    <Ionicons name="download-outline" size={16} color="#4F39F6" />
                    <Text className="text-primary text-xs font-medium ml-1">Download this version</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

export default VersionHistoryScreen;
