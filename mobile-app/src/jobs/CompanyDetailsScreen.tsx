import React from "react";
import { notify } from "@/lib/notify";
import { openHttpUrl } from "@/lib/openApplyUrl";
import { View, Text, Pressable, Image } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState, EmptyState, RatingStars } from "@/components/ui";
import { JobCard } from "@/components/cards";
import { useCompanyDetail, useCompanyJobs, useToggleSavedJob, useSavedJobs } from "@/hooks/useJobs";
import type { JobStackParamList, Job } from "@/types";

type Nav = NativeStackNavigationProp<JobStackParamList, "CompanyDetails">;
type Rte = RouteProp<JobStackParamList, "CompanyDetails">;

export function CompanyDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { data: company, isLoading, isError, refetch } = useCompanyDetail(params.companyId);
  const { data: jobs } = useCompanyJobs(params.companyId);
  const { data: saved } = useSavedJobs();
  const savedIds = new Set((saved ?? []).map((j) => j.id));

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Loading company..." /></Screen>;
  if (isError || !company) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load company." onRetry={refetch} /></Screen>;

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>{company.name}</Text>
      </View>

      <View className="flex-row items-center mb-4">
        <View className="w-14 h-14 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
          {company.logoUrl ? (
            <Image source={{ uri: company.logoUrl }} className="w-full h-full rounded-xl" resizeMode="cover" />
          ) : (
            <Ionicons name="business-outline" size={26} color="#4F39F6" />
          )}
        </View>
        <View className="flex-1">
          <Text className="font-bold text-gray-900 text-lg">{company.name}</Text>
          {company.website && (
            <Pressable
              onPress={async () => {
                if (!(await openHttpUrl(company.website))) notify("Couldn't open link", "This company's website link isn't valid.");
              }}
            >
              <Text className="text-primary text-sm">{company.website}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View className="flex-row items-center mb-5" style={{ gap: 16 }}>
        <View className="flex-row items-center">
          <RatingStars rating={company.rating} size={14} />
          <Text className="text-gray-500 text-sm ml-1">
            {company.rating.toFixed(1)} ({company.reviewCount.toLocaleString()} Reviews)
          </Text>
        </View>
      </View>
      <View className="flex-row items-center mb-6">
        <Ionicons name="business-outline" size={14} color="#9CA3AF" />
        <Text className="text-gray-400 text-sm ml-1.5 mr-4">Internet / Product</Text>
        <Ionicons name="people-outline" size={14} color="#9CA3AF" />
        <Text className="text-gray-400 text-sm ml-1.5">{company.employeeCount} Employees</Text>
      </View>

      <Text className="font-bold text-gray-900 mb-2">About {company.name}</Text>
      <Text className="text-gray-500 text-sm leading-5 mb-6">{company.about || "No company description available yet."}</Text>

      <Text className="font-bold text-gray-900 mb-3">Open Positions</Text>
      {!jobs || jobs.length === 0 ? (
        <EmptyState icon="briefcase-outline" title="No open positions right now" />
      ) : (
        jobs.slice(0, 5).map((job) => <CompanyJobItem key={job.id} job={job} isSaved={savedIds.has(job.id)} navigation={navigation} />)
      )}

      {jobs && jobs.length > 0 && (
        <Button label={`View All Jobs (${jobs.length})`} variant="outline" className="mt-2 mb-6" onPress={() => (navigation as any).navigate("SearchJobs", { initialQuery: company.name })} />
      )}
    </Screen>
  );
}

function CompanyJobItem({ job, isSaved, navigation }: { job: Job; isSaved: boolean; navigation: Nav }) {
  const toggleSaved = useToggleSavedJob(job.id);
  return (
    <JobCard
      job={job}
      isSaved={isSaved}
      onToggleSave={() => toggleSaved.mutate(isSaved)}
      onPress={(j) => (navigation as any).navigate("JobDetails", { jobId: j.id })}
    />
  );
}

export default CompanyDetailsScreen;
