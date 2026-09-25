import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { useProjectDetail, useDownloadFile, useDownloadableFiles } from "@/hooks/useProjects";
import type { ProjectStackParamList } from "@/types";

type Rte = RouteProp<ProjectStackParamList, "DownloadProject">;

export function DownloadProjectScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: project, isLoading, isError, refetch } = useProjectDetail(params.projectId);
  const {
    data: files,
    isLoading: isFilesLoading,
    isError: isFilesError,
    refetch: refetchFiles,
  } = useDownloadableFiles(params.projectId, project);
  const { downloadFile, downloadingKey } = useDownloadFile();

  if (isLoading || isFilesLoading) return <Screen className="items-center justify-center"><LoadingState label="Loading files..." /></Screen>;
  if (isError || !project) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load project files." onRetry={refetch} /></Screen>;
  if (isFilesError || !files) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load project files." onRetry={refetchFiles} /></Screen>;

  const handleDownload = async (file: (typeof files)[number]) => {
    try {
      await downloadFile({ projectId: project.id, fileName: file.fileName, label: file.label, url: file.url, sizeMB: file.sizeMB });
    } catch (error: any) {
      notify("Download failed", error.message ?? "Please check your connection and try again.");
    }
  };

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
          {project.title}
        </Text>
      </View>

      <Text className="text-gray-400 text-sm mb-3">Downloads</Text>
      {files.length === 0 && (
        <Text className="text-gray-500 text-sm mb-3">No downloadable files are available for this project yet. Please contact support.</Text>
      )}
      {files.map((file) => {
        const isDownloading = downloadingKey === file.fileName;
        return (
          <View key={file.fileName} className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 mb-3">
            <View className="flex-row items-center flex-1">
              <Ionicons name="document-outline" size={20} color="#4F39F6" />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-gray-900" numberOfLines={1}>{file.label}</Text>
                {file.sizeMB > 0 && <Text className="text-gray-400 text-xs">{file.sizeMB.toFixed(1)} MB</Text>}
              </View>
            </View>
            <Pressable onPress={() => handleDownload(file)} disabled={isDownloading} className="w-9 h-9 items-center justify-center">
              {isDownloading ? <ActivityIndicator color="#4F39F6" /> : <Ionicons name="download-outline" size={20} color="#4F39F6" />}
            </Pressable>
          </View>
        );
      })}

      <Button
        label="Need Help? Contact Support"
        variant="outline"
        className="mt-4"
        onPress={() => (navigation.getParent() as any)?.navigate("SettingsModule", { screen: "ContactSupport" })}
      />
    </Screen>
  );
}

export default DownloadProjectScreen;
