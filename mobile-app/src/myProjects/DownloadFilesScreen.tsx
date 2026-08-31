import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useProjectFiles, useVersionHistory } from "@/hooks/useMyProjects";
import { useDownloadFile } from "@/hooks/useProjects";
import type { MyProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<MyProjectsStackParamList, "DownloadFiles">;
type Rte = RouteProp<MyProjectsStackParamList, "DownloadFiles">;

export function DownloadFilesScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { data: files, isLoading, isError, refetch } = useProjectFiles(params.projectId, "main");
  const { data: versions } = useVersionHistory(params.projectId);
  const { downloadFile, downloadingKey } = useDownloadFile();

  const latestVersion = versions?.find((v) => v.isLatest);

  const handleDownload = async (file: NonNullable<typeof files>[number]) => {
    try {
      await downloadFile({ projectId: params.projectId, fileName: file.fileName, label: file.label, url: file.url, sizeMB: file.sizeMB });
    } catch (error: any) {
      notify("Download failed", error.message ?? "Please check your connection and try again.");
    }
  };

  const handleDownloadAll = async () => {
    if (!files) return;
    for (const file of files) {
       
      await handleDownload(file);
    }
  };

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Download Files</Text>
      </View>

      {latestVersion && (
        <Pressable
          onPress={() => (navigation as any).navigate("VersionHistory", { projectId: params.projectId })}
          className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 mb-5"
        >
          <View>
            <View className="flex-row items-center">
              <Text className="font-bold text-gray-900 mr-2">Version {latestVersion.version}</Text>
              <View className="bg-primary rounded-full px-2 py-0.5"><Text className="text-white text-[10px] font-semibold">Latest</Text></View>
            </View>
            <Text className="text-gray-400 text-xs mt-1">Latest Update: {new Date(latestVersion.releasedAt).toLocaleDateString()}</Text>
          </View>
          <Text className="text-primary text-sm font-medium">Changelog</Text>
        </Pressable>
      )}

      <Text className="text-gray-400 text-sm mb-3">Main Files</Text>

      {isLoading ? (
        <LoadingState label="Loading files..." />
      ) : isError ? (
        <ErrorState message="Couldn't load files." onRetry={refetch} />
      ) : !files || files.length === 0 ? (
        <EmptyState icon="document-outline" title="No files available yet" />
      ) : (
        files.map((file) => {
          const isDownloading = downloadingKey === file.fileName;
          return (
            <View key={file.id} className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 mb-3">
              <View className="flex-row items-center flex-1">
                <Ionicons name="document-outline" size={20} color="#4F39F6" />
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900" numberOfLines={1}>{file.label}</Text>
                  <Text className="text-gray-400 text-xs">{file.sizeMB.toFixed(1)} MB</Text>
                </View>
              </View>
              <Pressable onPress={() => handleDownload(file)} disabled={isDownloading} className="w-9 h-9 items-center justify-center">
                {isDownloading ? <ActivityIndicator color="#4F39F6" /> : <Ionicons name="download-outline" size={20} color="#4F39F6" />}
              </Pressable>
            </View>
          );
        })
      )}

      <View className="flex-row mt-1 mb-4" style={{ gap: 20 }}>
        <Pressable
          onPress={() => (navigation as any).navigate("Documentation", { projectId: params.projectId })}
          className="flex-row items-center"
        >
          <Ionicons name="document-text-outline" size={16} color="#4F39F6" />
          <Text className="text-primary text-sm font-medium ml-1.5">View Documentation</Text>
        </Pressable>
        <Pressable
          onPress={() => (navigation as any).navigate("SourceCode", { projectId: params.projectId })}
          className="flex-row items-center"
        >
          <Ionicons name="code-slash-outline" size={16} color="#4F39F6" />
          <Text className="text-primary text-sm font-medium ml-1.5">View Source Code</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => (navigation as any).navigate("Support")}
        className="flex-row items-start bg-gray-50 rounded-2xl p-4 mb-5"
      >
        <Ionicons name="help-circle-outline" size={20} color="#4F39F6" />
        <View className="ml-3 flex-1">
          <Text className="font-semibold text-gray-900 text-sm">Need Help?</Text>
          <Text className="text-gray-500 text-xs mt-0.5">Check the documentation or contact support if you face any issues.</Text>
        </View>
      </Pressable>

      <Button label="Download All" onPress={handleDownloadAll} className="mb-6" />
    </Screen>
  );
}

export default DownloadFilesScreen;
