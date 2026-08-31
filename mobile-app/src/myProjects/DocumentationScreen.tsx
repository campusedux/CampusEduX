import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useProjectFiles } from "@/hooks/useMyProjects";
import { useDownloadFile } from "@/hooks/useProjects";
import type { MyProjectsStackParamList } from "@/types";

type Rte = RouteProp<MyProjectsStackParamList, "Documentation">;

export function DocumentationScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: docs, isLoading, isError, refetch } = useProjectFiles(params.projectId, "documentation");
  const { downloadFile, downloadingKey } = useDownloadFile();

  const handleDownload = async (doc: NonNullable<typeof docs>[number]) => {
    try {
      await downloadFile({ projectId: params.projectId, fileName: doc.fileName, label: doc.label, url: doc.url, sizeMB: doc.sizeMB });
    } catch (error: any) {
      notify("Download failed", error.message ?? "Please check your connection and try again.");
    }
  };

  const handleDownloadAll = async () => {
    if (!docs) return;
    for (const doc of docs) {
       
      await handleDownload(doc);
    }
  };

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Documentation</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading documentation..." />
      ) : isError ? (
        <ErrorState message="Couldn't load documentation." onRetry={refetch} />
      ) : !docs || docs.length === 0 ? (
        <EmptyState icon="document-text-outline" title="No documentation available yet" />
      ) : (
        <>
          {docs.map((doc) => {
            const isDownloading = downloadingKey === doc.fileName;
            return (
              <View key={doc.id} className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 mb-3">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="document-text-outline" size={20} color="#4F39F6" />
                  <View className="ml-3 flex-1">
                    <Text className="font-medium text-gray-900" numberOfLines={1}>{doc.label}</Text>
                    <Text className="text-gray-400 text-xs">{doc.sizeMB.toFixed(1)} MB</Text>
                  </View>
                </View>
                <Pressable onPress={() => handleDownload(doc)} disabled={isDownloading} className="w-9 h-9 items-center justify-center">
                  {isDownloading ? <ActivityIndicator color="#4F39F6" /> : <Ionicons name="download-outline" size={20} color="#4F39F6" />}
                </Pressable>
              </View>
            );
          })}
          <Button label="Download All Docs" onPress={handleDownloadAll} className="mt-2 mb-6" />
        </>
      )}
    </Screen>
  );
}

export default DocumentationScreen;
