import React, { useState } from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState } from "@/components/ui";
import { notify } from "@/lib/notify";
import { useOwnedProjectDetail, useOwnedProjects, useProjectFiles } from "@/hooks/useMyProjects";
import { useDownloadFile } from "@/hooks/useProjects";
import type { MyProjectsStackParamList } from "@/types";

type Rte = RouteProp<MyProjectsStackParamList, "SourceCode">;
type Tab = "github" | "zip";

export function SourceCodeScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const [tab, setTab] = useState<Tab>("github");

  const { data: files } = useProjectFiles(params.projectId, "main");
  const sourceZip = files?.find((f) => f.fileName.endsWith(".zip"));
  const { downloadFile, downloadingKey } = useDownloadFile();

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Source Code</Text>
      </View>

      <View className="flex-row mb-5" style={{ gap: 8 }}>
        <TabButton label="GitHub" active={tab === "github"} onPress={() => setTab("github")} />
        <TabButton label="Zip File" active={tab === "zip"} onPress={() => setTab("zip")} />
      </View>

      {tab === "github" ? (
        <GithubTab projectId={params.projectId} />
      ) : (
        <View className="items-center border border-gray-100 rounded-2xl p-6">
          <Ionicons name="folder-outline" size={40} color="#4F39F6" />
          <Text className="font-semibold text-gray-900 mt-3 mb-1">{sourceZip?.label ?? "Source Code (Full Project)"}</Text>
          {sourceZip && <Text className="text-gray-400 text-xs mb-4">{sourceZip.sizeMB.toFixed(1)} MB</Text>}
          <Button
            label="Download ZIP"
            loading={downloadingKey === sourceZip?.fileName}
            disabled={!sourceZip || !sourceZip.url}
            onPress={() =>
              sourceZip &&
              downloadFile({ projectId: params.projectId, fileName: sourceZip.fileName, label: sourceZip.label, url: sourceZip.url, sizeMB: sourceZip.sizeMB }).catch(
                (error: any) => notify("Download failed", error.message ?? "Please try again.")
              )
            }
            className="w-full"
          />
        </View>
      )}
    </Screen>
  );
}

function GithubTab({ projectId }: { projectId: string }) {
  // Repo metadata lives on OwnedProjectDetail (keyed by orderId), but this
  // screen only has projectId — resolve the owning order first.
  const { data: purchased } = useOwnedProjects("purchased");
  const order = purchased?.find((p) => p.project.id === projectId);
  const { data: owned, isLoading, isError } = useOwnedProjectDetail(order?.orderId ?? "");

  if (isLoading) return <LoadingState label="Loading repository details..." />;
  if (isError || !owned?.repo) {
    return (
      <View className="items-center border border-gray-100 rounded-2xl p-8">
        <Ionicons name="logo-github" size={40} color="#111827" />
        <Text className="text-gray-500 text-sm mt-3 text-center">GitHub repository isn&apos;t linked for this project yet.</Text>
      </View>
    );
  }

  const repoUrl = owned.githubUrl ?? `https://github.com/${owned.repo.owner}/${owned.repo.name}`;

  return (
    <View className="items-center border border-gray-100 rounded-2xl p-6 mb-5">
      <Ionicons name="logo-github" size={44} color="#111827" />
      <Text className="font-semibold text-gray-900 mt-3 mb-1">View Source Code on GitHub</Text>
      <Text className="text-gray-400 text-sm text-center mb-4">Explore, clone or contribute to the source code on GitHub.</Text>
      <Button label="Open GitHub Repository" variant="outline" onPress={() => Linking.openURL(repoUrl)} className="w-full mb-5" />

      <View className="w-full border-t border-gray-100 pt-4">
        <Text className="font-bold text-gray-900 mb-3 self-start">Repository Details</Text>
        <RepoRow label="Repository" value={owned.repo.name} />
        <RepoRow label="Owner" value={owned.repo.owner} />
        <RepoRow label="Language" value={owned.repo.language} />
        <RepoRow label="Last Updated" value={new Date(owned.repo.updatedAt).toLocaleDateString()} />
        <RepoRow label="Stars" value={`${owned.repo.stars}`} />
        <RepoRow label="Forks" value={`${owned.repo.forks}`} last />
      </View>
    </View>
  );
}

function RepoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row justify-between w-full ${last ? "" : "mb-2"}`}>
      <Text className="text-gray-500 text-sm">{label}</Text>
      <Text className="text-gray-900 font-medium text-sm">{value}</Text>
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center py-2.5 rounded-xl border"
      style={{ backgroundColor: active ? "#4F39F6" : "#fff", borderColor: active ? "#4F39F6" : "#E5E7EB" }}
    >
      <Text className={active ? "text-white font-semibold" : "text-gray-600 font-medium"}>{label}</Text>
    </Pressable>
  );
}

export default SourceCodeScreen;
