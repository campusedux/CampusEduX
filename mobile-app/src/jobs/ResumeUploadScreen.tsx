import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { MAX_RESUME_LABEL } from "@/lib/resumeFile";
import { notify } from "@/lib/notify";
import { useNavigation, useRoute, RouteProp, CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState } from "@/components/ui";
import { useResumes, usePickAndUploadResume, useApplyToJob } from "@/hooks/useJobs";
import type { JobStackParamList } from "@/types";

type Rte = RouteProp<JobStackParamList, "ResumeUpload">;

export function ResumeUploadScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: resumes, isLoading } = useResumes();
  const { pickAndUpload, isUploading } = usePickAndUploadResume();
  const applyToJob = useApplyToJob(params.jobId);

  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePick = async () => {
    try {
      const uploaded = await pickAndUpload();
      if (uploaded) setSelectedResumeId(uploaded.id);
    } catch (error: any) {
      notify("Couldn't upload resume", error.message ?? "Please try again.");
    }
  };

  const handleContinue = async () => {
    if (!selectedResumeId) {
      notify("Choose a resume", "Please upload or select a resume to continue.");
      return;
    }
    setIsSubmitting(true);
    try {
      const applicationId = await applyToJob.mutateAsync(selectedResumeId);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "ApplicationStatus", params: { applicationId } }],
        })
      );
    } catch (error: any) {
      notify("Couldn't submit application", error.message ?? "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Upload Resume</Text>
      </View>

      <Pressable
        onPress={handlePick}
        disabled={isUploading}
        className="items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl py-10 mb-6"
      >
        {isUploading ? (
          <ActivityIndicator color="#4F39F6" />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={36} color="#4F39F6" />
            <Text className="text-gray-500 text-sm mt-3">Upload your resume</Text>
            <View className="bg-primary rounded-lg px-4 py-2 mt-3">
              <Text className="text-white font-medium text-sm">Browse File</Text>
            </View>
            <Text className="text-gray-400 text-xs mt-3">Supported formats: PDF, DOC, DOCX · Max file size: {MAX_RESUME_LABEL}</Text>
          </>
        )}
      </Pressable>

      <Text className="text-gray-500 text-sm mb-2">Or choose from</Text>
      {isLoading ? (
        <LoadingState label="Loading your resumes..." />
      ) : !resumes || resumes.length === 0 ? (
        <Text className="text-gray-400 text-sm mb-6">No previous resumes yet — upload one above.</Text>
      ) : (
        resumes.map((resume) => {
          const isSelected = selectedResumeId === resume.id;
          return (
            <Pressable
              key={resume.id}
              onPress={() => setSelectedResumeId(resume.id)}
              className="flex-row items-center justify-between border rounded-xl px-4 py-3.5 mb-3"
              style={{ borderColor: isSelected ? "#4F39F6" : "#E5E7EB", backgroundColor: isSelected ? "#EEF0FF" : "#fff" }}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="document-text-outline" size={20} color="#4F39F6" />
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900" numberOfLines={1}>{resume.fileName}</Text>
                  <Text className="text-gray-400 text-xs">Uploaded on {new Date(resume.uploadedAt).toLocaleDateString()}</Text>
                </View>
              </View>
              <Ionicons name={isSelected ? "radio-button-on" : "radio-button-off"} size={20} color={isSelected ? "#4F39F6" : "#D1D5DB"} />
            </Pressable>
          );
        })
      )}

      <Button label="Continue" loading={isSubmitting} onPress={handleContinue} className="mt-4 mb-6" />
    </Screen>
  );
}

export default ResumeUploadScreen;
