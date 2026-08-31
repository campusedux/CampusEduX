import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { useOwnedProjects, useVersionHistory, useMarkVersionUpdated } from "@/hooks/useMyProjects";
import type { MyProjectsStackParamList } from "@/types";

type Rte = RouteProp<MyProjectsStackParamList, "UpdateAvailable">;

export function UpdateAvailableScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: versions, isLoading, isError, refetch } = useVersionHistory(params.projectId);
  const { data: purchased } = useOwnedProjects("purchased");
  const order = purchased?.find((p) => p.project.id === params.projectId);
  const markUpdated = useMarkVersionUpdated(order?.orderId ?? "");
  const [updating, setUpdating] = useState(false);

  const latest = versions?.find((v) => v.isLatest);
  const previous = versions?.find((v) => !v.isLatest);

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Checking for updates..." /></Screen>;
  if (isError || !latest) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't check for updates." onRetry={refetch} /></Screen>;

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      if (order) await markUpdated.mutateAsync(latest.version);
      (navigation as any).navigate("DownloadFiles", { projectId: params.projectId });
    } catch (error: any) {
      notify("Couldn't complete update", error.message ?? "Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Screen className="px-6 items-center">
      <Pressable onPress={() => navigation.goBack()} className="self-start mt-2 mb-4">
        <Ionicons name="arrow-back" size={22} color="#111827" />
      </Pressable>

      <View className="w-28 h-28 rounded-full items-center justify-center mb-6" style={{ backgroundColor: "#EEF0FF" }}>
        <Ionicons name="rocket-outline" size={52} color="#4F39F6" />
      </View>

      <Text className="text-xl font-bold text-gray-900 mb-2 text-center">New Update Available!</Text>
      <Text className="text-gray-500 text-center mb-6">A new version {latest.version} is available for download.</Text>

      {latest.changelog.length > 0 && (
        <View className="w-full border border-gray-100 rounded-2xl p-4 mb-6">
          <Text className="font-bold text-gray-900 mb-2">What&apos;s New in v{latest.version}</Text>
          {latest.changelog.map((item) => (
            <View key={item} className="flex-row items-start mb-1.5">
              <Ionicons name="checkmark" size={14} color="#16A34A" style={{ marginTop: 3 }} />
              <Text className="text-gray-600 text-sm ml-2 flex-1">{item}</Text>
            </View>
          ))}
        </View>
      )}

      <View className="w-full flex-row justify-between mb-8">
        <View>
          <Text className="text-gray-400 text-xs">Current Version</Text>
          <Text className="text-gray-900 font-semibold">{previous?.version ?? "—"}</Text>
        </View>
        <View className="items-end">
          <Text className="text-gray-400 text-xs">Latest Version</Text>
          <Text className="text-primary font-semibold">{latest.version}</Text>
        </View>
      </View>

      <Button label="Update Now" loading={updating} onPress={handleUpdate} className="w-full mb-3" />
      <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
        <Text className="text-primary font-medium">Not Now</Text>
      </Pressable>
    </Screen>
  );
}

export default UpdateAvailableScreen;
