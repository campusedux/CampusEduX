import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState, RatingStars } from "@/components/ui";
import { notify } from "@/lib/notify";
import { useJobDetail, useToggleSavedJob, useCompanyDetail } from "@/hooks/useJobs";
import type { JobStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<JobStackParamList, "JobDetails">;
type Rte = RouteProp<JobStackParamList, "JobDetails">;

type Tab = "description" | "company";

export function JobDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { data: job, isLoading, isError, refetch } = useJobDetail(params.jobId);
  const toggleSaved = useToggleSavedJob(params.jobId);
  const { data: company } = useCompanyDetail(job?.companyId ?? "");
  const [tab, setTab] = useState<Tab>("description");

  const handleToggleSaved = (isSaved: boolean) => {
    toggleSaved.mutate(isSaved, {
      onError: (error: any) =>
        notify("Couldn't update saved jobs", error?.message ?? "Please try again."),
    });
  };

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Loading job..." /></Screen>;
  if (isError || !job) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load this job." onRetry={refetch} /></Screen>;

  return (
    <Screen>
      <ScrollView className="px-6">
        <View className="flex-row items-center justify-between mt-2 mb-4">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Pressable onPress={() => handleToggleSaved(job.isSaved)}>
            <Ionicons name={job.isSaved ? "bookmark" : "bookmark-outline"} size={22} color={job.isSaved ? "#4F39F6" : "#111827"} />
          </Pressable>
        </View>

        <View className="flex-row items-center mb-4">
          <View className="w-14 h-14 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
            <Ionicons name="business-outline" size={26} color="#4F39F6" />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-gray-900 text-lg" numberOfLines={2}>{job.title}</Text>
            <Text className="text-gray-500 text-sm mt-0.5">{job.companyName}</Text>
            <View className="flex-row items-center mt-1">
              <RatingStars rating={job.companyRating} size={12} />
              <Text className="text-gray-400 text-xs ml-1">({job.companyReviewCount.toLocaleString()} Reviews)</Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center flex-wrap mb-5" style={{ gap: 16 }}>
          <InfoTag icon="location-outline" label={job.location} />
          <InfoTag icon="briefcase-outline" label={job.jobType} />
          <InfoTag icon="cash-outline" label={job.salaryRange} />
          {job.experience ? <InfoTag icon="time-outline" label={job.experience} /> : null}
        </View>

        <View className="flex-row border-b border-gray-100 mb-4">
          <TabButton label="Job Details" active={tab === "description"} onPress={() => setTab("description")} />
          <TabButton label="About Company" active={tab === "company"} onPress={() => setTab("company")} />
        </View>

        {tab === "description" ? (
          <>
            <Text className="font-bold text-gray-900 mb-2">Job Description</Text>
            <Text className="text-gray-500 text-sm leading-5 mb-5">{job.description || "No description provided."}</Text>

            {job.requirements.length > 0 && (
              <>
                <Text className="font-bold text-gray-900 mb-2">Requirements</Text>
                {job.requirements.map((req) => (
                  <View key={req} className="flex-row items-start mb-1.5">
                    <Ionicons name="checkmark" size={14} color="#16A34A" style={{ marginTop: 3 }} />
                    <Text className="text-gray-600 text-sm ml-2 flex-1">{req}</Text>
                  </View>
                ))}
              </>
            )}

            {job.skills.length > 0 && (
              <>
                <Text className="font-bold text-gray-900 mt-5 mb-2">Skills</Text>
                <View className="flex-row flex-wrap mb-6" style={{ gap: 8 }}>
                  {job.skills.map((skill) => (
                    <View key={skill} className="bg-gray-100 rounded-lg px-3 py-1.5">
                      <Text className="text-gray-700 text-xs font-medium">{skill}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <Pressable
              onPress={() => (navigation as any).navigate("RecruiterDetails", { jobId: job.id })}
              className="flex-row items-center justify-between border-t border-gray-100 py-4 mb-6"
            >
              <Text className="font-semibold text-gray-900">View Recruiter Details</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>
          </>
        ) : (
          <View className="mb-6">
            <Text className="font-bold text-gray-900 mb-2">About {job.companyName}</Text>
            <Text className="text-gray-500 text-sm leading-5 mb-4">
              {company?.about || `${job.companyName}'s mission is to organize its industry's information and make it universally accessible.`}
            </Text>
            {company && (
              <Button
                label="View Company Profile"
                variant="outline"
                onPress={() => (navigation as any).navigate("CompanyDetails", { companyId: company.id })}
              />
            )}
          </View>
        )}
      </ScrollView>

      <View className="px-6 py-4 border-t border-gray-100">
        <Button
          label={job.hasApplied ? "Already Applied" : "Apply Now"}
          disabled={job.hasApplied}
          onPress={() => (navigation as any).navigate("ApplyJob", { jobId: job.id })}
        />
      </View>
    </Screen>
  );
}

function InfoTag({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View className="flex-row items-center">
      <Ionicons name={icon} size={14} color="#6B7280" />
      <Text className="text-gray-500 text-xs ml-1.5">{label}</Text>
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="mr-6 pb-3" style={{ borderBottomWidth: active ? 2 : 0, borderBottomColor: "#4F39F6" }}>
      <Text className={active ? "text-primary font-semibold" : "text-gray-500"}>{label}</Text>
    </Pressable>
  );
}

export default JobDetailsScreen;
