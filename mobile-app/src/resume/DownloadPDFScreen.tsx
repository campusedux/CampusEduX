import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp, CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { notify, confirmAction } from "@/lib/notify";
import { useResumeDetail, useDownloadResumePdf } from "@/hooks/useResume";
import type { ResumeStackParamList } from "@/types";

type Rte = RouteProp<ResumeStackParamList, "DownloadPDF">;

export function DownloadPDFScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: resume, isLoading, isError, refetch } = useResumeDetail(params.resumeId);
  const { download, isGenerating } = useDownloadResumePdf(params.resumeId, resume?.title ?? "Resume");

  const handleDownload = async () => {
    try {
      await download();
    } catch (error: any) {
      notify("Couldn't prepare resume", error.message ?? "Please try again.");
    }
  };

  const handleCloudSave = (appName: string) => {
    confirmAction(
      `Save to ${appName}`,
      `We'll open the share sheet — pick ${appName} from the list to save your resume there.`,
      handleDownload,
      "Continue"
    );
  };

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Preparing your resume..." /></Screen>;
  if (isError || !resume) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load this resume." onRetry={refetch} /></Screen>;

  return (
    <Screen className="px-6 items-center">
      <View className="flex-row items-center w-full mt-2 mb-8">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Download Resume</Text>
      </View>

      <View className="w-20 h-20 rounded-2xl items-center justify-center mb-4" style={{ backgroundColor: "#FEE2E2" }}>
        <Ionicons name="document-text" size={36} color="#DC2626" />
      </View>
      <Text className="text-lg font-bold text-gray-900 mb-1">Your resume is ready!</Text>
      <Text className="text-gray-400 text-center mb-8">Choose an option to download or share your resume.</Text>

      <OptionRow icon="download-outline" label="Download as PDF" loading={isGenerating} onPress={handleDownload} />
      <OptionRow icon="share-social-outline" label="Share as PDF" loading={isGenerating} onPress={handleDownload} />
      <OptionRow icon="logo-google" label="Save to Drive" loading={isGenerating} onPress={() => handleCloudSave("Drive")} />
      <OptionRow icon="cloud-outline" label="Save to Dropbox" loading={isGenerating} onPress={() => handleCloudSave("Dropbox")} />

      <Button
        label="Back to Dashboard"
        variant="outline"
        className="w-full mt-6"
        onPress={() => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "ResumeDashboard" }] }))}
      />
    </Screen>
  );
}

function OptionRow({
  icon,
  label,
  loading,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={loading} className="flex-row items-center justify-between w-full border border-gray-100 rounded-2xl p-4 mb-3">
      <View className="flex-row items-center">
        <Ionicons name={icon} size={20} color="#4F39F6" />
        <Text className="text-gray-900 font-medium ml-3">{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </Pressable>
  );
}

export default DownloadPDFScreen;
